/*******************************************************************************
*   Project      : S32M27xEVB_BLDC_6step_sensorless
*   Revision     : 1.2
*   RTD Version  : 7.0.1
*   Brief description  :
*   - application entry function (main)
*   - interrupt service routine
*   - state machine functions
*
*   Copyright 2025-2026 NXP
*
*   NXP Proprietary. This software is owned or controlled by NXP and may only be
*   used strictly in accordance with the applicable license terms. By expressly
*   accepting such terms or by downloading, installing, activating and/or otherwise
*   using the software, you are agreeing that you have read, and that you agree to
*   comply with and are bound by, such license terms. If you do not agree to be
*   bound by the applicable license terms, then you may not retain, install,
*   activate or otherwise use the software.
*******************************************************************************/
/******************************************************************************
 * main.c
 *
 * rev 1.0 Initial release
 * rev 1.1 updated AEC_DPGAConfig() function call - now also the voltage detector limits are configured in graphical config tool, not manually via API call
 * REV 1.2 Added support for RTD 7.0.0
 *
 ********************************************************************************/
/*==================================================================================================
*                                        INCLUDE FILES
==================================================================================================*/

#ifdef __cplusplus
extern "C" {
#endif


/*==================================================================================================
*                                        INCLUDE FILES
* 1) system and project includes
* 2) needed interfaces from external units
* 3) internal and external interfaces from this unit
==================================================================================================*/
#include "Siul2_Port_Ip.h"
#include "Siul2_Dio_Ip.h"
#include "Siul2_Icu_Ip.h"
#include "Clock_Ip.h"
#include "Lpuart_Uart_Ip.h"
#include "freemaster.h"
#include "freemaster_s32_lpuart.h"
#include "Pit_Ip.h"
#include "IntCtrl_Ip.h"
#include "Emios_Gpt_Ip.h"
#include "Emios_Mcl_Ip.h"
#include "Emios_Pwm_Ip.h"
#include "Trgmux_Ip.h"
#include "Adc_Sar_Ip.h"
#include "Bctu_Ip.h"
#include "actuate_s32m.h"
#include "meas_s32m.h"
#include "motor_structure.h"
#include "state_machine.h"
#include "config\BLDC_appconfig.h"
#include "Peripherals\peripherals_config.h"
#include "amclib.h"
#include "Lcu_Ip.h"
#include "Lpspi_Ip.h"
#include "Aec_Ip.h"
#include "CDD_GDU.h"
#include "Dpga_Ip.h"
#include "S32M27x_HVI_AE.h"
#include "S32M27x_PMC_AE.h"
#include "FlexCAN_Ip.h"


/*==================================================================================================
*                                       LOCAL MACROS
==================================================================================================*/

#define APP_TRG_DELAY_MAX               (0.9F)  /* 90% of the Half PWM period */
#define APP_TRG_DELAY_MIN               (APP_TRG_DELAY_MAX * 0.1F)    /* 10% of the APP_TRG_DELAY_MAX */
#define ROTATION_DIR_CW                 0
#define ROTATION_DIR_CCW                1

/* ADVANCE_ANGLE' = 0.5 * ADVANCED_ANGLE  */
#define ADVANCE_ANGLE                   FRAC16(0.3815)

/* Duty cycle limit for DC bus current measurement */
#define DC_THRESHOLD                    10.0F

/* DC Bus Voltage MA filter defined by Lambda */
#define DCBV_FILTER_MA_LAMBDA            0.25F
/* DC Bus Current Offset MA filter defined by Lambda */
#define CALIB_FILTER_MA_LAMBDA           0.001F
/* Wait 0.5s to settle DC bus current offset
 * CALIB_TIMER = PWM freq/2Hz = 20kHz/2Hz */
#define CALIB_TIMER                      10000

/* Speed increase step [RPM] */
#define SPEED_INC                        100.0F
/* Speed decrease step [RPM] */
#define SPEED_DEC                        100.0F
/* Maximal speed [RPM] */
//#define SPEED_MAX                        2000.0F

/* Maximum number of stall check errors */
#define STALLCHECK_MAX_ERRORS            6
/* Minimal stall commutation period */
/* 20KRPM => 125us => 156.25 @625kHz */
#define STALLCHECK_MIN_CMT_PERIOD        156

/* User switch debounce timeout */
#define SW_PRESS_DEBOUNCE                75
/* User switch input blocking delay */
#define SW_PRESS_OFF                     250

#define MSG_ID_CAN0 0xC0FE
#define TX_MB_IDX 0U
#define RX_MB_IDX 1U
#define AEC_DATAWIDTH_16 16U
#define AEC_DATAWIDTH_32 32U

/*==================================================================================================
*                                      GLOBAL VARIABLES
==================================================================================================*/
/* Motor control measurements */
Bctu_Ip_FifoResultType measuredValues[16];
uint8_t mCount = 0;

volatile int exit_code = 0;

tFloat speed_fb = 0.0F;
Lcu_Ip_SyncInputValueType InputSector[4] =
{
    {LCU_LOGIC_INPUT_8, 0U},
    {LCU_LOGIC_INPUT_9, 0U},
    {LCU_LOGIC_INPUT_10, 0U},
    {LCU_LOGIC_INPUT_11, 0U}
};

Lcu_Ip_SyncInputValueType Alignment[6] =
{
    {LCU_LOGIC_INPUT_0, 0U},
    {LCU_LOGIC_INPUT_1, 0U},
    {LCU_LOGIC_INPUT_2, 0U},
    {LCU_LOGIC_INPUT_4, 0U},
    {LCU_LOGIC_INPUT_5, 0U},
    {LCU_LOGIC_INPUT_6, 0U}
};

Bctu_Ip_TrigConfigType bemfPhaseList[6] =
{
    {
        .TrigIndex = 2U, /* BCTU_EMIOS_0_2 */
        .LoopEn = FALSE,
        .DataDest = BCTU_IP_DATA_DEST_ADC_DATA_REG,
        .HwTriggersEn = TRUE,
        .TrigType = BCTU_IP_TRIG_TYPE_LIST,
        .AdcTargetMask = 3U,
        .AdcChanOrListStart = 0U /* Start index in BCTU LIST, because trigger is configured in LIST mode */
    },
    {
        .TrigIndex = 2U, /* BCTU_EMIOS_0_2 */
        .LoopEn = FALSE,
        .DataDest = BCTU_IP_DATA_DEST_ADC_DATA_REG,
        .HwTriggersEn = TRUE,
        .TrigType = BCTU_IP_TRIG_TYPE_LIST,
        .AdcTargetMask = 3U,
        .AdcChanOrListStart = 2U /* Start index in BCTU LIST, because trigger is configured in LIST mode */
    },
    {
        .TrigIndex = 2U, /* BCTU_EMIOS_0_2 */
        .LoopEn = FALSE,
        .DataDest = BCTU_IP_DATA_DEST_ADC_DATA_REG,
        .HwTriggersEn = TRUE,
        .TrigType = BCTU_IP_TRIG_TYPE_LIST,
        .AdcTargetMask = 3U,
        .AdcChanOrListStart = 4U /* Start index in BCTU LIST, because trigger is configured in LIST mode */
    },
    {
        .TrigIndex = 2U, /* BCTU_EMIOS_0_2 */
        .LoopEn = FALSE,
        .DataDest = BCTU_IP_DATA_DEST_ADC_DATA_REG,
        .HwTriggersEn = TRUE,
        .TrigType = BCTU_IP_TRIG_TYPE_LIST,
        .AdcTargetMask = 3U,
        .AdcChanOrListStart = 0U /* Start index in BCTU LIST, because trigger is configured in LIST mode */
    },
    {
        .TrigIndex = 2U, /* BCTU_EMIOS_0_2 */
        .LoopEn = FALSE,
        .DataDest = BCTU_IP_DATA_DEST_ADC_DATA_REG,
        .HwTriggersEn = TRUE,
        .TrigType = BCTU_IP_TRIG_TYPE_LIST,
        .AdcTargetMask = 3U,
        .AdcChanOrListStart = 2U /* Start index in BCTU LIST, because trigger is configured in LIST mode */
    },
    {
        .TrigIndex = 2U, /* BCTU_EMIOS_0_2 */
        .LoopEn = FALSE,
        .DataDest = BCTU_IP_DATA_DEST_ADC_DATA_REG,
        .HwTriggersEn = TRUE,
        .TrigType = BCTU_IP_TRIG_TYPE_LIST,
        .AdcTargetMask = 3U,
        .AdcChanOrListStart = 4U /* Start index in BCTU LIST, because trigger is configured in LIST mode */
    }
};

/* Application State and Control Variables */
uint8_t      appState = APP_INIT;
uint8_t      rotationDir = ROTATION_DIR_CCW;
uint8_t      appSwitchState = 0, faultSwitchClear;
int16_t      switchCounter[2], switchOffCounter;
uint32_t     ledCounter;
tDriveStatus driveStatus;
tFaultStatus faultStatus, faultStatusLatched;

/* Measurement/Actuate Variables */
tADCresults  ADCResults;
tFloat       duty_cycle;

/* BEMF Zero Cross Detection and SixStep Commutation control Variables */
tFloat         bemfVoltage, bemfVoltageOld;
tFloat         timeBackEmf, timeOldBackEmf, timeZCToff;
int8_t         NextCmtSector, ActualCmtSector;
uint16_t       actualPeriodZC;
uint32_t       period6ZC;
uint16_t       periodZC[6];
uint16_t       advanceAngle;
int16_t        NextCmtPeriod;
tFloat         emiosTrigDelay;
uint16_t       debugTmin, debugTmax, periodZcAvrg, stallCheckCounter;
uint16_t       debugTminLim, debugTmaxLim;
uint16_t       calibTimer, alignmentTimer, startCMTcounter, freewheelTimer;
tFloat         delta;

/* Speed and Current Control Loop Variables */
tFloat       torqueErr;
tFloat       speedErr;
tFloat       requiredSpeed = N_MIN;
tFloat       requiredSpeedRamp;
tFloat       actualSpeed = 0.0F;
tFloat       speedPIOut, currentPIOut;
tFloat       u_dc_bus_filt, torque_filt;

GFLIB_CONTROLLER_PIAW_P_T_FLT speedPIPrms, currentPIPrms;
GFLIB_RAMP_T_FLT              speedRampPrms;
GDFLIB_FILTER_MA_T_FLT        Idcb_filt,Udcb_filt, Idcb_calib,speed_filt;

/*------------------------------------
 * MCAT - Referenced Variables
 * ----------------------------------*/

/* MCAT Parameters tab */
tFloat    mcat_alignVoltage    = ALIGN_VOLTAGE;
uint16_t  mcat_alignDuration   = ALIGN_DURATION;

/* MCAT Sensorless tab */
tFloat    mcat_NMin            = N_MIN;
uint16_t  mcat_FreewheelTLong  = FREEWHEEL_T_LONG;
uint16_t  mcat_FreewheelTShort = FREEWHEEL_T_SHORT;
uint8_t   mcat_startCmtCnt     = STARTUP_CMT_CNT;
uint16_t  mcat_startCmtPer     = STARTUP_CMT_PER;
tFloat    mcat_startCmtAcceler = START_CMT_ACCELER;
tFloat    mcat_cmtTOff         = CMT_T_OFF;
tFloat    mcat_integThr        = INTEG_TRH;

/*  FreeMASTER constants */
tU32   fm_voltage;
tU32   fm_current;
tU32   fm_speed;

AEFaultStatus_t	AEFaultStatus;
uint32 SPI_rx_data =0;
tU16  	AEHealthStatus = 0;
tBool	ReadAEStatus = 0;

tU32	LEDCnt = 0;

/*==================================================================================================
*                                   LOCAL FUNCTION PROTOTYPES
==================================================================================================*/
// static void BoardButtons(void);
static void LCUSensorless_EnableOutput(void);
static void MCAT_Init(void);

void Pit1Notif(void);
void eMIOS1GptNotify(void);

/*==================================================================================================
*                                    FUNCTIONS DEFINITION
==================================================================================================*/


/* reserved for future use */
void Gdu_Notif (uint32 InterruptFlags)
{

}

/* reserved for future use */
void Dpga_Callback (Dpga_Ip_EventType Event)
{

}

/*FUNCTION**********************************************************************
 *
 * Function Name : main
 * Description   : It initializes peripherals, and Feemaster communication.
 *                 On the background it maintains freemaster communication.
 *
 *END**************************************************************************/


volatile boolean bRxFlag = FALSE;
Flexcan_Ip_MsgBuffType aRxDataBuffer[10U];/* Configuration of FlexCAN */

   Flexcan_Ip_DataInfoType rx_info = {
      		.msg_id_type = FLEXCAN_MSG_ID_EXT,
      		.data_length = 8U,
      		.is_polling = TRUE,
      		.is_remote = FALSE,
      		.fd_enable = TRUE,
      		.enable_brs = TRUE
   };


void Callback_FlexCAN(uint8 instance,
		Flexcan_Ip_EventType eventType,
		uint32 buffIdx,
		const struct FlexCANState *driverState)
{
	if (FLEXCAN_EVENT_RX_COMPLETE == eventType)
	{
		/* Configure Rx message buffer */
		FlexCAN_Ip_ConfigRxMb(INST_FLEXCAN_0, 1U, &rx_info, MSG_ID_CAN0);
		/* Prepare to receive the next message */
		FlexCAN_Ip_Receive(INST_FLEXCAN_0, 1U, aRxDataBuffer, TRUE);

		bRxFlag = TRUE;
	}

	(void)instance;
	(void)buffIdx;
	(void)driverState;
}

int main(void)
{
    StatusType status;
    Aec_Ip_StatusType AEStatus = 0;
	Siul2_Port_Ip_PinSettingsConfig TempPinSettings[1];

    /* Initialize the clock driver */
    Clock_Ip_Init(Clock_Ip_aClockConfig);
    
    OsIf_Init(NULL_PTR);

	/***********************************************************************************************
	* Port Driver
	***********************************************************************************************/
	Siul2_Port_Ip_Init(NUM_OF_CONFIGURED_PINS_PortContainer_0_BOARD_InitPeripherals, g_pin_mux_InitConfigArr_PortContainer_0_BOARD_InitPeripherals);

	//ADC interleave for PTA6 / ADC1_S18 not set through PINS tool, thus current configuration is read and interleave configured manually
	Siul2_Port_Ip_GetPinConfiguration(PORTA_L_HALF, &TempPinSettings[0], 6);
	TempPinSettings[0].adcInterleaves[0] = DCM_GPR_DCMRWF4_MUX_MODE_EN_ADC1_S18_MASK;
	TempPinSettings[0].adcInterleaves[1] = DCM_GPR_DCMRWF4_MUX_MODE_EN_ADC1_S18_MASK;
	Siul2_Port_Ip_Init(1, TempPinSettings);

	//ADC interleave for PTB12 / ADC0_S17 not set through PINS tool, thus current configuration is read and interleave configured manually
	Siul2_Port_Ip_GetPinConfiguration(PORTB_L_HALF, &TempPinSettings[0], 12);
	TempPinSettings[0].adcInterleaves[0] = DCM_GPR_DCMRWF4_MUX_MODE_EN_ADC0_S17_MASK;
	TempPinSettings[0].adcInterleaves[1] = DCM_GPR_DCMRWF4_MUX_MODE_EN_ADC0_S17_MASK;
	Siul2_Port_Ip_Init(1, TempPinSettings);


    /***********************************************************************************************
    * Triggermux Driver
    ***********************************************************************************************/
    Trgmux_Ip_Init(&Trgmux_Ip_Sa_xTrgmuxInitPB);

    /***********************************************************************************************
    * UART Driver
    ***********************************************************************************************/
    /* Initializes an UART driver*/
    Lpuart_Uart_Ip_Init(0U,&Lpuart_Uart_Ip_xHwConfigPB_0);

    /***********************************************************************************************
    * LCU Driver
    ***********************************************************************************************/
    Lcu_Ip_Init(&Lcu_Ip_Sa_xLcuInitPB);
    LCUSensorless_EnableOutput();

    /***********************************************************************************************
    * SPI Driver
    ***********************************************************************************************/
    Lpspi_Ip_Init(&Lpspi_Ip_PhyUnitConfig_SpiPhyUnit_0_Instance_1);

    /***********************************************************************************************
    * PIT Driver
    ***********************************************************************************************/
    Pit_Ip_Init(1U, &PIT_1_InitConfig_PB);
    Pit_Ip_InitChannel(1U, PIT_1_ChannelConfig_PB);
    Pit_Ip_EnableChannelInterrupt(1U, 1U);
    Pit_Ip_StartChannel(1U, 1U, 30000U);  /* PIT 1ms */

    /***********************************************************************************************
    * eMios Driver
    ***********************************************************************************************/
    Emios_Mcl_Ip_Init(0U, &Emios_Mcl_Ip_Sa_0_Config);
	Emios_Mcl_Ip_Init(1U, &Emios_Mcl_Ip_Sa_1_Config);
    /* PWM signals generation */
    Emios_Pwm_Ip_InitChannel(0U, &Emios_Pwm_Ip_Sa_I0_Ch1);
    /* EMIOS0_Ch2 is used for triggering BCTU (Bemf and Udc) */
    Emios_Pwm_Ip_InitChannel(0U, &Emios_Pwm_Ip_Sa_I0_Ch2);
    /* EMIOS0_Ch3 is used for triggering BCTU (Idc) */
    Emios_Pwm_Ip_InitChannel(0U, &Emios_Pwm_Ip_Sa_I0_Ch3);

    /***********************************************************************************************
    * ADC Driver
    ***********************************************************************************************/
    do {
        status = (StatusType)Adc_Sar_Ip_Init(0U, &AdcHwUnit_0);
    } while (status != E_OK);

    do {
        status = (StatusType)Adc_Sar_Ip_Init(1U, &AdcHwUnit_1);
    } while (status != E_OK);

    do {
        status = (StatusType)Adc_Sar_Ip_DoCalibration(0U);
    } while (status != E_OK);

    do {
        status = (StatusType)Adc_Sar_Ip_DoCalibration(1U);
    } while (status != E_OK);

    /***********************************************************************************************
    * AE Driver
    ***********************************************************************************************/
    AECConfig();

   	/* Initialize PWM driver */
   	ACTUATE_DisableOutput();
   	/* Mask all FTM3 channels to disable PWM output */

   	AEStatus = 1;
   	//Check status
   	AEStatus = Aec_Ip_SpiRead((uint32_t)&IP_AEC_AE->VERID, 16, &SPI_rx_data);

   	while (!(AEStatus == 0))//Check status loop till status OK
   	{
   			//global health status error (clock miss, wrong answer, faults)
   		AEStatus = Aec_Ip_SpiRead((uint32_t) &IP_AEC_AE->VERID, 16, &SPI_rx_data);
   			// Update global variable again
   	}

   	// configure AE modules
   	AEC_PMCConfig(1,0);
	AEC_ResetConfig();
	AEC_HVMConfig();
	Aec_Ip_SpiRead((uint32_t) &IP_PMC_AE->MONITOR, 32, &AEFaultStatus.PMCMonitorRegister);
	Aec_Ip_SpiWrite((uint32_t) &IP_PMC_AE->MONITOR, 32, AEFaultStatus.PMCMonitorRegister);//reset flags which may have appeared during reset in PMC
	AEC_GDUConfig();
	Aec_Ip_SpiRead((uint32_t) &IP_GDU_AE->INTF, 8, &AEFaultStatus.GDUInterruptFlag);
	Aec_Ip_SpiWrite((uint32_t) &IP_GDU_AE->INTF, 8, AEFaultStatus.GDUInterruptFlag);//reset flags which may have appeared during reset
	AEC_DPGAConfig();

    /* CANPHY Configuration */
    Aec_Ip_SpiRead((uint32_t) &IP_PMC_AE->CONFIG, AEC_DATAWIDTH_32, &SPI_rx_data);
    Aec_Ip_SpiWrite((uint32_t) &IP_PMC_AE->CONFIG, AEC_DATAWIDTH_32, SPI_rx_data | 0xE);
    Aec_Ip_SpiRead((uint32_t) &IP_AEC_AE->RSTGEN_CFG, AEC_DATAWIDTH_16, &SPI_rx_data);
    Aec_Ip_SpiWrite((uint32_t) &IP_AEC_AE->RSTGEN_CFG, AEC_DATAWIDTH_16, SPI_rx_data | AEC_AE_RSTGEN_CFG_RSTGEN_CFG(2));
    Aec_Ip_SpiRead((uint32_t) &IP_AEC_AE->CANPHY_CFG, AEC_DATAWIDTH_16, &SPI_rx_data);
    Aec_Ip_SpiWrite((uint32_t) &IP_AEC_AE->CANPHY_CFG, AEC_DATAWIDTH_16, SPI_rx_data | AEC_AE_CANPHY_CFG_CANPHY_ENABLE_MASK | (0x1));

	AEStatus = Aec_Ip_SpiRead((uint32_t)&IP_AEC_AE->VERID, 16, &SPI_rx_data);
	AEHealthStatus = Aec_Ip_DecodeGlobalHealthStatus();

	if ((AEStatus == 0) && ((AEHealthStatus & 0xC0) == 0))
	{
		//Do nothing since communication is ok and no alarm event or fault detected by global health status bit 6 and 7
	}
	else
	{
		AEFaultStatus.AEIntFlag = 1;
		ReadAEStatus = 1; //In case AE communication is not ok or fault is detected by global health status, raise a flag as if AE fault was detected by PTD3 input
	}
	/***********************************************************************************************
	*Configure and enable interrupts
	***********************************************************************************************/
	IntCtrl_Ip_Init(&IntCtrlConfig_0);

    /***********************************************************************************************
	* Interrupt from analog extension
	***********************************************************************************************/
	/* Initialize ICU channel for AE interrupt. */
	Siul2_Icu_Ip_Init(0U, &Siul2_Icu_Ip_0_Config_PB);
	/* Enable ICU edge detect for  interrupt. */
	Siul2_Icu_Ip_EnableInterrupt(0U, 11U);
	Siul2_Icu_Ip_EnableNotification(0U, 11U);
    /***********************************************************************************************
    * BCTU Driver
    ***********************************************************************************************/
    Bctu_Ip_Init(0U, &BctuHwUnit_0);
    Bctu_Ip_SetGlobalTriggerEn(0U, TRUE);

    /***********************************************************************************************
    * eMIOS GPT Driver
    ***********************************************************************************************/
    Emios_Gpt_Ip_InitChannel(1U, &EMIOS_1_ChannelConfig_PB[0]);
    Emios_Gpt_Ip_EnableChannelInterrupt(1U, 8U);

	/***********************************************************************************************
	 * FlexCAN
	 ***********************************************************************************************/

   	/* Initialize FlexCAN driver */
   	FlexCAN_Ip_Init(INST_FLEXCAN_0, &FlexCAN_State0, &FlexCAN_Config0);

   	/* Set Rx filter mask type */
   	FlexCAN_Ip_SetRxMaskType(INST_FLEXCAN_0, FLEXCAN_RX_MASK_INDIVIDUAL);

   	/* Set Rx individual mask value */
   	/* Expect to receive all IDs, mask = 0x0 */
   	FlexCAN_Ip_SetRxIndividualMask(INST_FLEXCAN_0, 1U, 0xFFFFFFFF);

   	/* Start FlexCAN controller */
   	FlexCAN_Ip_SetStartMode(INST_FLEXCAN_0);

   	/* Configure Rx message buffer */
   	FlexCAN_Ip_ConfigRxMb(INST_FLEXCAN_0, 1U, &rx_info, MSG_ID_CAN0);

   	/* Start trigger to receive messages */
   	FlexCAN_Ip_Receive(INST_FLEXCAN_0, 1U, aRxDataBuffer, TRUE);

    /***********************************************************************************************
    * FreeMASTER
    ***********************************************************************************************/
    /* Set FreeMASTER serial base address. */
	FMSTR_SerialSetBaseAddress((FMSTR_ADDR)IP_LPUART_0_BASE);
    /* Freemaster initalization      */
    FMSTR_Init();
    /***********************************************************************************************
    * Application
    ***********************************************************************************************/
    /* MCAT variables initialization */
    MCAT_Init();


    faultStatus.B.AEFault = 0;
    //ACTUATE_EnableOutput();

    /*enable timebases at last to ensure proper timing*/
	Emios_Mcl_Ip_ConfigureGlobalTimebase(0U, TRUE);
	Emios_Mcl_Ip_ConfigureGlobalTimebase(1U, TRUE);

    FlexCAN_Ip_Send(INST_FLEXCAN_0, 0U, &rx_info, 0xBEEF, (uint8*)"PATO");

    while (1)
    {
    	FMSTR_Poll();
       AppStateMachine[appState]();


       /*Check AE status */

		if (ReadAEStatus) //AE status is read when this flag is set in PORTD_Notif notification function
		{

			//fault status already read in PTD3 ISR
			Aec_Ip_SpiRead((uint32_t) &IP_AEC_AE->EVENTS_STATUS,16, &AEFaultStatus.AEEventStatus);

			Aec_Ip_SpiWrite((uint32_t) &IP_AEC_AE->FAULTS_STATUS,16, AEFaultStatus.AEFaultStatus);//Clear W1C bits
			Aec_Ip_SpiWrite((uint32_t) &IP_AEC_AE->EVENTS_STATUS,16, AEFaultStatus.AEEventStatus);//Clear W1C bits

			Aec_Ip_SpiRead((uint32_t) &IP_PMC_AE->MONITOR, 32, &AEFaultStatus.PMCMonitorRegister);
			Aec_Ip_SpiWrite((uint32_t) &IP_PMC_AE->MONITOR, 32, AEFaultStatus.PMCMonitorRegister);//Clear W1C bits

			Aec_Ip_SpiRead((uint32_t) &IP_GDU_AE->INTF,8, &AEFaultStatus.GDUInterruptFlag);
			Aec_Ip_SpiWrite((uint32_t) &IP_GDU_AE->INTF,8, AEFaultStatus.GDUInterruptFlag);//Clear W1C bits

			Aec_Ip_SpiRead((uint32_t) &IP_DPGA_AE->INTF,8, &AEFaultStatus.DPGAInterruptFlag);
			Aec_Ip_SpiWrite((uint32_t) &IP_DPGA_AE->INTF,8, AEFaultStatus.DPGAInterruptFlag);//Clear W1C bits

			Aec_Ip_SpiRead((uint32_t) &IP_HVI_AE->INTF,32, &AEFaultStatus.HVMInterruptFlags);
			Aec_Ip_SpiWrite((uint32_t) &IP_HVI_AE->INTF,32, AEFaultStatus.HVMInterruptFlags);//Clear W1C bits

			ReadAEStatus = 0;
		}

       CheckFaults();

       switch(appState)
		{
			case APP_STOP:
				Siul2_Dio_Ip_WritePin(LED_PORT, LED_PIN, 1U);
				LEDCnt = 0;
				break;

			case APP_RUN:

				if (LEDCnt == 1000000)
				{
					Siul2_Dio_Ip_TogglePins(LED_PORT, 1 << LED_PIN);
					LEDCnt = 0;
				}

				break;

			case APP_FAULT:

				if (LEDCnt == 50000)
				{
					Siul2_Dio_Ip_TogglePins(LED_PORT, 1 << LED_PIN);
					LEDCnt = 0;
				}
				if (LEDCnt > 50000)
				{
					LEDCnt = 0;
				}

				break;

			default:
				Siul2_Dio_Ip_WritePin(LED_PORT, LED_PIN, 0U);
				LEDCnt = 0;
				break;

		}

		LEDCnt++;

    }

   // Exit_Example(TRUE);
    return (0U);
}

/*FUNCTION**********************************************************************
 *
 * Function Name : BctuListNotif
 * Description   : BCTU LIST IRQ handler.
 *
 *END**************************************************************************/
void BctuListNotif(void)
{
    static tBool getFcnStatus;
    Siul2_Dio_Ip_SetPins(TST_GPIO_D16_PORT, (1 << TST_GPIO_D16_PIN));
       /* DCB voltage, DCB current and phase currents measurement */
    getFcnStatus  = MEAS_GetUdcVoltage(&ADCResults.DCBVVoltage);
    getFcnStatus &= MEAS_GetIdcCurrent(&ADCResults.DCBIVoltageRaw);
    ADCResults.DCBIVoltage = MLIB_Sub(ADCResults.DCBIVoltageRaw, ADCResults.DCBIOffset);
    u_dc_bus_filt = GDFLIB_FilterMA(ADCResults.DCBVVoltage, &Udcb_filt);
//    /* bemfVoltage = Voltage of the disconnected phase - DC Bus voltage/2 */
    getFcnStatus &= MEAS_GetBEMFVoltage(&ADCResults.BEMFVoltage);
    bemfVoltage = MLIB_Sub(ADCResults.BEMFVoltage, MLIB_Div(u_dc_bus_filt, 2.0F));
    if (duty_cycle > DC_THRESHOLD)
    {
        torque_filt = GDFLIB_FilterMA(ADCResults.DCBIVoltage, &Idcb_filt);
    }
    else
    {
        /* Ignore DC bus current measurement at low duty cycles */
        torque_filt = GDFLIB_FilterMA(0, &Idcb_filt);
    }

    /* ZC detection algorithm is ignored in Sensorbased mode */
    timeOldBackEmf = timeBackEmf;
    timeBackEmf    = (uint16_t)Emios_Gpt_Ip_GetCounterValue(1U, 8U);

    if ((driveStatus.B.AfterCMT == 0) && (driveStatus.B.NewZC == 0) && (driveStatus.B.Sensorless == 1))
    {
        /* If the BEMF voltage is falling, invert BEMF voltage value */
        if ((ActualCmtSector & 0x01) == 0)
        {
            bemfVoltage = -bemfVoltage;
        }

        /* Rising BEMF zero-crossing detection */
        if (bemfVoltage >= 0)
        {
            /* Rising interpolation */
            delta = bemfVoltage - bemfVoltageOld;
            if ((driveStatus.B.AdcSaved == 1) && (delta > bemfVoltage))
            {
                timeBackEmf -= MLIB_Mul(MLIB_Div(bemfVoltage, delta), MLIB_Sub(timeBackEmf, timeOldBackEmf));
            }
            else
            {
                timeBackEmf -= MLIB_Div(MLIB_Sub(timeBackEmf, timeOldBackEmf), 2);
            }

            periodZC[ActualCmtSector] = (uint16_t)timeBackEmf + NextCmtPeriod;

            /* Average of the previous and current ZC period */
            actualPeriodZC = (actualPeriodZC + periodZC[ActualCmtSector]) >> 1;
            /* AdvancedAngle(0.3815) = 0.5 * Advanced Angle(0.763) */
            NextCmtPeriod = MLIB_Mul_F16(actualPeriodZC, advanceAngle);

            /* Update commutation period */
            Emios_Gpt_Ip_StopTimer(1U, 8U);
            Emios_Gpt_Ip_StartTimer(1U, 8U, NextCmtPeriod);


            driveStatus.B.NewZC = 1;
        }
        /* Save actual BEMF voltage (for ADCsamples interpolation) */
        bemfVoltageOld = bemfVoltage;
        driveStatus.B.AdcSaved = 1;
    }

    if ((driveStatus.B.AfterCMT == 1)&& (driveStatus.B.Sensorless == 1))
    {
        if(timeBackEmf > timeZCToff)
        {
            driveStatus.B.AfterCMT = 0;
            Bctu_Ip_ConfigTrigger(0U, &bemfPhaseList[ActualCmtSector]);
        }
    }

    /* Timer for Rotor alignment */
    if(driveStatus.B.Alignment)
    {
        if(alignmentTimer > 0)
        {
            alignmentTimer--;
        }
        driveStatus.B.AdcSaved = 0;
    }

    /* Calibration timer for DC bus current offset measurement */
    if(driveStatus.B.Calib)
    {
        calibTimer--;
    }

    Siul2_Dio_Ip_ClearPins(TST_GPIO_D16_PORT, (1 << TST_GPIO_D16_PIN));
    FMSTR_Recorder(0);

}


/*FUNCTION**********************************************************************
 *
 * Function Name : Pit1Notif
 * Description   : PIT1 IRQ handler.
 *
 *END**************************************************************************/
void Pit1Notif(void)
{
    uint8_t i = 1;

    Siul2_Dio_Ip_SetPins(TST_GPIO_B5_PORT, (1 << TST_GPIO_B5_PIN));
    period6ZC = periodZC[0];
        for(i=1;i<6;i++)
    {
        period6ZC += periodZC[i];
    }
    actualSpeed = 30.0F*625.0F*1000.0F/(tFloat)period6ZC;
    speed_fb = actualSpeed;

    if (driveStatus.B.CloseLoop == 1)
    {
        torqueErr = MLIB_Sub(I_DCB_LIMIT, torque_filt);
        currentPIOut = GFLIB_ControllerPIpAW(torqueErr, &currentPIPrms);

        /* Speed control */

        /* Upper speed limit due to the limited DC bus voltage 12V */
        if (requiredSpeed >= N_NOM)
        {
            requiredSpeed = N_NOM;
        }

        /* Lower speed limit keeping reliable sensorless operation */
        if (requiredSpeed < mcat_NMin)
        {
            requiredSpeed = mcat_NMin;
        }

        requiredSpeedRamp = GFLIB_Ramp(requiredSpeed, &speedRampPrms);
        speedErr = MLIB_Sub(requiredSpeedRamp, speed_fb);
        speedPIOut = GFLIB_ControllerPIpAW(speedErr, &speedPIPrms);

        if (currentPIOut >= speedPIOut)
        {
            /* If max torque not achieved, use speed PI output */
            currentPIPrms.fltIntegPartK_1 = speedPIOut;
            currentPIPrms.fltInK_1 = 0;
            /* PWM duty cycle update <- speed PI */
            duty_cycle = speedPIOut;

            driveStatus.B.CurrentLimiting = 0;
        }
        else
        {
            /* Limit speed PI output by current PI if max. torque achieved */
            speedPIPrms.fltIntegPartK_1 = currentPIOut;
            speedPIPrms.fltInK_1 = 0;
            /* PWM duty cycle update <- current PI */
            duty_cycle = currentPIOut;
            driveStatus.B.CurrentLimiting = 1;
        }
    }

    if (duty_cycle < 1.0F) duty_cycle = 1.0F;
    if (duty_cycle > 90.0F) duty_cycle = 90.0F;


    /* Freewheeling is ignored in Sensor based mode */
    if (driveStatus.B.Freewheeling)
    {
        if (freewheelTimer > 0)
        {
            freewheelTimer--;
        }
        else
        {
            driveStatus.B.Freewheeling = 0;
        }
    }

    emiosTrigDelay = (MLIB_Mul(MLIB_Div(duty_cycle, 2.0F), APP_TRG_DELAY_MAX));

    /* Saturate, if emiosTrigDelay is lower than APP_TRG_DELAY_MIN */
    if(emiosTrigDelay < (50.0F*APP_TRG_DELAY_MIN))
        emiosTrigDelay = 50.0F*APP_TRG_DELAY_MIN;

    ACTUATE_SetDutycycleAndTrigger(duty_cycle/100.0F,emiosTrigDelay/100.0F);
    Siul2_Dio_Ip_ClearPins(TST_GPIO_B5_PORT, (1 << TST_GPIO_B5_PIN));
    CheckSwitchState();
    FlexCAN_Ip_MainFunctionRead(INST_FLEXCAN_0, 1U);
    if(TRUE == bRxFlag)
    {
    	CheckFlexCANState();
    	bRxFlag = FALSE;
    }
}

void eMIOS1GptNotify(void)
{

    if (driveStatus.B.Sensorless == 1)
    {
        /* Update commutation period to maximum to avoid GPT interrupt during zero-cross searching  */
        Emios_Gpt_Ip_StopTimer(1U, 8U);
        Emios_Gpt_Ip_StartTimer(1U, 8U, 65000U);

        timeZCToff = MLIB_Mul(((tFloat)actualPeriodZC), MLIB_Mul(mcat_cmtTOff, 0.01F));
        driveStatus.B.StallCheckReq = 1;
    }
    else
    {
        /* Update commutation period */
        Emios_Gpt_Ip_StopTimer(1U, 8U);
        Emios_Gpt_Ip_StartTimer(1U, 8U, NextCmtPeriod);
    }

    ActualCmtSector = NextCmtSector;
    if (driveStatus.B.EnableCMT)
    {
        if (rotationDir == ROTATION_DIR_CW)
        {
            InputSector[3].Value = 0x00;
            NextCmtSector--;
            if(NextCmtSector < 0)
            {
                NextCmtSector = 5;
            }
        }
        else
        {
            InputSector[3].Value = 0x01;
            NextCmtSector++;
            if(NextCmtSector > 5)
            {
                NextCmtSector = 0;
            }
        }
        InputSector[0].Value = (ActualCmtSector>>0) & 0x01;
        InputSector[1].Value = (ActualCmtSector>>1) & 0x01;
        InputSector[2].Value = (ActualCmtSector>>2) & 0x01;
        Lcu_Ip_SetSyncInputSwOverrideValue(InputSector, 4U);
    }
    driveStatus.B.NewZC = 0;
    driveStatus.B.AdcSaved = 0;
    driveStatus.B.AfterCMT = 1;
    timeBackEmf = 0;
    timeOldBackEmf = 0;
}


/*FUNCTION**********************************************************************
 *
 * Function Name : LCUSensorless_EnableOutput
 * Description   : LCU outputs enable.
 *
 *END**************************************************************************/
void LCUSensorless_EnableOutput(void)
{
    Lcu_Ip_SyncInputValueType SWOverride[4U];
    Lcu_Ip_SyncOutputValueType lcuEnable[4U];

    SWOverride[0].LogicInputId = LCU_LOGIC_INPUT_8;
    SWOverride[0].Value = 1;
    SWOverride[1].LogicInputId = LCU_LOGIC_INPUT_9;
    SWOverride[1].Value = 1;
    SWOverride[2].LogicInputId = LCU_LOGIC_INPUT_10;
    SWOverride[2].Value = 1;
    SWOverride[3].LogicInputId = LCU_LOGIC_INPUT_11;
    SWOverride[3].Value = 1;
    Lcu_Ip_SetSyncInputSwOverrideEnable(SWOverride, 4U);

    lcuEnable[0].LogicOutputId = LCU_LOGIC_OUTPUT_6;
    lcuEnable[0].Value = 1U;
    lcuEnable[1].LogicOutputId = LCU_LOGIC_OUTPUT_7;
    lcuEnable[1].Value = 1U;
    lcuEnable[2].LogicOutputId = LCU_LOGIC_OUTPUT_8;
    lcuEnable[2].Value = 1U;
    lcuEnable[3].LogicOutputId = LCU_LOGIC_OUTPUT_9;
    lcuEnable[3].Value = 1U;
    Lcu_Ip_SetSyncOutputEnable(lcuEnable, 4U);

    InputSector[0].Value = 1U;
    InputSector[1].Value = 1U;
    InputSector[2].Value = 1U;
    Lcu_Ip_SetSyncInputSwOverrideValue(InputSector, 4U);
}

/*FUNCTION**********************************************************************
 *
 * Function Name : MCAT_Init
 * Description   : Load MCAT parameters.
 *
 *END**************************************************************************/
static void MCAT_Init(void)
{
    ADCResults.DCBIOffset  = I_MAX;
    ADCResults.DCBVVoltage = 12.0F;

    fm_voltage = FM_U_DCB_SCALE;
    fm_current = FM_I_SCALE;
    fm_speed   = FM_N_SCALE;

    /* Initialize DC bus voltage moving average filter  */
    Udcb_filt.fltLambda = DCBV_FILTER_MA_LAMBDA;
    GDFLIB_FilterMAInit_FLT(&Udcb_filt);

    speed_filt.fltLambda = 0.005F;
    GDFLIB_FilterMAInit_FLT(&speed_filt);

    /* Initialize DC bus current moving average filter */
    Idcb_filt.fltLambda = TORQUE_LOOP_MAF;
    GDFLIB_FilterMAInit_FLT(&Idcb_filt);

    /* Initialize moving average filter for DC bus current offset calibration */
    Idcb_calib.fltLambda = CALIB_FILTER_MA_LAMBDA;
    GDFLIB_FilterMAInit_FLT(&Idcb_calib);

    /* Speed PI controller initialization */
    speedPIPrms.fltPropGain   = SPEED_LOOP_KP_GAIN;
    speedPIPrms.fltIntegGain  = SPEED_LOOP_KI_GAIN;
    speedPIPrms.fltUpperLimit = CTRL_LOOP_LIM_HIGH;
    speedPIPrms.fltLowerLimit = CTRL_LOOP_LIM_LOW;

    /* Current PI controller initialization */
    currentPIPrms.fltPropGain   = TORQUE_LOOP_KP_GAIN;
    currentPIPrms.fltIntegGain  = TORQUE_LOOP_KI_GAIN;
    currentPIPrms.fltUpperLimit = CTRL_LOOP_LIM_HIGH;;
    currentPIPrms.fltLowerLimit = CTRL_LOOP_LIM_LOW;

    /* Speed ramp initialization */
    speedRampPrms.fltRampUp   = SPEED_LOOP_RAMP_UP;
    speedRampPrms.fltRampDown = SPEED_LOOP_RAMP_DOWN;

    /* StallCheck initialization */
    debugTmin             = 0;
    debugTmax             = 0;
    periodZcAvrg          = 0;
    stallCheckCounter     = 0;

    /* MCAT Parameters tab */
    mcat_alignVoltage     = ALIGN_VOLTAGE;
    mcat_alignDuration    = ALIGN_DURATION;

    /* MCAT Sensorless tab */
    mcat_NMin             = N_MIN;
    mcat_FreewheelTLong   = FREEWHEEL_T_LONG;
    mcat_FreewheelTShort  = FREEWHEEL_T_SHORT;
    mcat_startCmtCnt      = STARTUP_CMT_CNT;
    mcat_startCmtPer      = STARTUP_CMT_PER;
    mcat_startCmtAcceler  = START_CMT_ACCELER;
    mcat_cmtTOff          = CMT_T_OFF;
    mcat_integThr         = INTEG_TRH;
}

/*FUNCTION**********************************************************************
 *
 * Function Name : AppInit
 * Description   : BLDC application INIT state function.
 *
 *END**************************************************************************/
void AppInit(void)
{
    driveStatus.B.Alignment  = 0;
    driveStatus.B.EnableCMT  = 0;
    driveStatus.B.CloseLoop  = 0;
    driveStatus.B.Calib      = 0;
    driveStatus.B.Sensorless = 0;
    driveStatus.B.NewZC      = 0;

    /* Init parameters for DC bus current offset calibration */
    calibTimer               = CALIB_TIMER;
    ADCResults.DCBIOffset    = I_MAX;
    Idcb_calib.fltAcc        = I_MAX;

    /* Init parameters for Speed control */
    actualSpeed              = 0.0F;
    advanceAngle             = ADVANCE_ANGLE;
    duty_cycle				 = 1.0F;

    /* Disable all PWMs */
    ACTUATE_DisableOutput();

    /* Init parameters for SixStep Commutation control */
    NextCmtSector            = 0;    /* Starting sector */
    NextCmtPeriod            = mcat_startCmtPer;
    startCMTcounter          = mcat_startCmtCnt - 1;

    appState                 = APP_STOP;
}

/*FUNCTION**********************************************************************
 *
 * Function Name : AppStop
 * Description   : BLDC application STOP state function.
 *
 *END**************************************************************************/
void AppStop(void)
{
    /* Application can be turn on only if rotor stops */
    if ((appSwitchState == 1) && (driveStatus.B.Freewheeling == 0))
    {
        /* Enable actuator */
        duty_cycle= 1.0F;
        ACTUATE_EnableOutput();
        driveStatus.B.Calib = 1;
        appState = APP_CALIB;
    }
}

/*FUNCTION**********************************************************************
 *
 * Function Name : AppCalib
 * Description   : BLDC application CALIB state function.
 *
 *END**************************************************************************/
void AppCalib(void)
{
    /* Measure DC bus current offset */
    ADCResults.DCBIOffset = GDFLIB_FilterMA(ADCResults.DCBIVoltageRaw, &Idcb_calib);

    if (calibTimer == 0)
    {
        AppStopToAlignment();
    }
}

/*FUNCTION**********************************************************************
 *
 * Function Name : AppStopToAlignment
 * Description   : BLDC application STOP to ALIGN state transition function.
 *
 *END**************************************************************************/
void AppStopToAlignment(void)
{
    driveStatus.B.Alignment = 1;
    driveStatus.B.EnableCMT = 0;
    driveStatus.B.CloseLoop = 0;
    driveStatus.B.Calib = 0;
    driveStatus.B.Sensorless = 0;
    driveStatus.B.NewZC = 0;

    duty_cycle = MLIB_Mul(MLIB_Div(mcat_alignVoltage, U_PH_NOM), 100.0F);
    alignmentTimer = mcat_alignDuration;

    Alignment[0].Value = 1;
    Alignment[1].Value = 1;
    Alignment[2].Value = 1;
    Alignment[3].Value = 1;
    Alignment[4].Value = 1;
    Alignment[5].Value = 1;
    Lcu_Ip_SetSyncInputSwOverrideEnable(Alignment, 6U);
    Lcu_Ip_SetSyncInputSwOverrideValue(Alignment, 6U);

    appState = APP_ALIGNMENT;
}

/*FUNCTION**********************************************************************
 *
 * Function Name : AppAlignment
 * Description   : BLDC application ALIGN state function.
 *
 *END**************************************************************************/
void AppAlignment(void)
{
    if (alignmentTimer == 0)
    {
        AppAlignmentToStart();
    }
}

/*FUNCTION**********************************************************************
 *
 * Function Name : AppAlignmentToStart
 * Description   : BLDC application ALIGN to START state transition function.
 *
 *END**************************************************************************/
void AppAlignmentToStart(void)
{
    driveStatus.B.Alignment = 0;
    driveStatus.B.EnableCMT = 1;
    driveStatus.B.AfterCMT  = 0;

    if (rotationDir == ROTATION_DIR_CW)
        {
            InputSector[3].Value = 0x00;
        }
        else
        {
            InputSector[3].Value = 0x01;
        }
    InputSector[0].Value = 0;
    InputSector[1].Value = 0;
    InputSector[2].Value = 0;
    Lcu_Ip_SetSyncInputSwOverrideValue(InputSector, 4U);

    Alignment[0].Value = 0;
    Alignment[1].Value = 0;
    Alignment[2].Value = 0;
    Alignment[3].Value = 0;
    Alignment[4].Value = 0;
    Alignment[5].Value = 0;
    Lcu_Ip_SetSyncInputSwOverrideValue(Alignment, 6U);
    Lcu_Ip_SetSyncInputSwOverrideEnable(Alignment, 6U);

    /* Prepare PWM settings for initial commutation sector */
    Emios_Gpt_Ip_StopTimer(1u, 8u);
    Emios_Gpt_Ip_StartTimer(1u, 8u, STARTUP_CMT_PER);

    NextCmtPeriod = MLIB_Mul_F16(NextCmtPeriod, FRAC16(mcat_startCmtAcceler));

    appState = APP_START;
}

/*FUNCTION**********************************************************************
 *
 * Function Name : AppStart
 * Description   : BLDC application START state function.
 *
 *END**************************************************************************/
void AppStart(void)
{

    if(driveStatus.B.AfterCMT == 1)
    {
        // timeZC = NextCmtPeriod >> 1;
        startCMTcounter--;
        if(startCMTcounter > 0)
        {
            driveStatus.B.AfterCMT = 0;
            NextCmtPeriod = MLIB_Mul_F16(NextCmtPeriod, FRAC16(mcat_startCmtAcceler));
        }
    }

    if(startCMTcounter == 0)
    {
        AppStartToRun();
    }
}

/*FUNCTION**********************************************************************
 *
 * Function Name : AppStartToRun
 * Description   : BLDC application START to RUN state transition function.
 *
 *END**************************************************************************/
void AppStartToRun(void)
{
    uint8_t i;

    /* Speed PI controller initialization */
    speedPIPrms.fltInK_1 = 0;
    speedPIPrms.fltIntegPartK_1 = duty_cycle;

    /* Current PI controller initialization */
    currentPIPrms.fltInK_1 = 0;
    currentPIPrms.fltIntegPartK_1 = speedPIPrms.fltIntegPartK_1;

    /* Speed ramp initialization */
    speedRampPrms.fltState = mcat_NMin;

    appState = APP_RUN;
    stallCheckCounter = 0;
    faultStatus.B.StallError = 0;

    /* ZC period initialization before entering Close loop mode */
    for (i = 0; i < 6; i++)
    {
        periodZC[i] = NextCmtPeriod;
    }
    actualPeriodZC = NextCmtPeriod;
    driveStatus.B.Sensorless = 1;

    driveStatus.B.CloseLoop = 1;
}

/*FUNCTION**********************************************************************
 *
 * Function Name : AppRun
 * Description   : BLDC application RUN state function.
 *
 *END**************************************************************************/
void AppRun(void)
{
    if (appSwitchState == 0)
    {
        /* Disable actuator */
        ACTUATE_DisableOutput();

        freewheelTimer = mcat_FreewheelTLong;
        mcat_FreewheelTShort = 0;
        mcat_integThr = 0;
        driveStatus.B.Freewheeling = 1;

        appState = APP_INIT;
    }
}

/*FUNCTION**********************************************************************
 *
 * Function Name : AppFault
 * Description   : BLDC application FAULT state function.
 *
 *END**************************************************************************/
void AppFault(void)
{
    if (faultSwitchClear == 1)
    {
        driveStatus.B.Fault = 0;
        faultStatus.R = 0;
        faultStatusLatched.R = 0;
        faultSwitchClear = 0;
        appState = APP_INIT;

        AEFaultStatus.AEEventStatus		 = 0;
		AEFaultStatus.AEFaultStatus		 = 0;
		AEFaultStatus.DPGAInterruptFlag	 = 0;
		AEFaultStatus.GDUInterruptFlag 	 = 0;
		AEFaultStatus.HVMInterruptFlags  = 0;
		AEFaultStatus.PMCMonitorRegister = 0;

		Aec_Ip_SpiRead((uint32_t)&IP_AEC_AE->VERID, 16, &SPI_rx_data);
		AEHealthStatus = Aec_Ip_DecodeGlobalHealthStatus();
		AEHealthStatus &= (AEC_STATUS_EVENT_NOTIFY | AEC_STATUS_FAULT_NOTIFY );

		//Check for AE health status - in case of pending faults set flag to read AE status in background loop and set AEfaultflag	if (AEHealthStatus !=0)
		if (AEHealthStatus !=0)
		{
			AEFaultStatus.AEIntFlag = 1;
			ReadAEStatus = 1;
		}

        faultSwitchClear = 0;
        appState = APP_INIT;

    }
}

/*FUNCTION**********************************************************************
 *
 * Function Name : CheckFaults
 * Description   : BLDC application fault detection function.
 *
 *END**************************************************************************/
void CheckFaults(void)
{
    /* DC bus current overcurrent */
    if (ADCResults.DCBIVoltage > I_DCB_OVERCURRENT)
    {
        driveStatus.B.Alignment = 0;
        driveStatus.B.EnableCMT = 0;
        driveStatus.B.CloseLoop = 0;
        driveStatus.B.Sensorless = 0;
        driveStatus.B.NewZC = 0;

        faultStatus.B.OverDCBusCurrent = 1;

        /* Disable actuator */
        ACTUATE_DisableOutput();
    }
    else
    {
        faultStatus.B.OverDCBusCurrent = 0;
    }


    /* DC bus voltage overvoltage */
    if (ADCResults.DCBVVoltage > U_DCB_OVERVOLTAGE)
    {
        faultStatus.B.OverDCBusVoltage = 1;

        driveStatus.B.Alignment = 0;
        driveStatus.B.EnableCMT = 0;
        driveStatus.B.CloseLoop = 0;
        driveStatus.B.Sensorless = 0;
        driveStatus.B.NewZC = 0;

        /* Disable actuator */
        ACTUATE_DisableOutput();
    }
    else
    {
        faultStatus.B.OverDCBusVoltage = 0;
    }

    /* DC bus voltage undervoltage */
    if(ADCResults.DCBVVoltage < U_DCB_UNDERVOLTAGE)
    {
        faultStatus.B.UnderDCBusVoltage = 1;

        driveStatus.B.Alignment = 0;
        driveStatus.B.EnableCMT = 0;
        driveStatus.B.CloseLoop = 0;
        driveStatus.B.Sensorless = 0;
        driveStatus.B.NewZC = 0;

        /* Disable actuator */
        ACTUATE_DisableOutput();
    }
    else
    {
        faultStatus.B.UnderDCBusVoltage = 0;
    }

    /* Check the status of the Application Extension */
    if (AEFaultStatus.AEIntFlag)
	{

    	faultStatus.B.AEFault = 1;

	    driveStatus.B.Alignment = 0;
		driveStatus.B.EnableCMT = 0;
		driveStatus.B.CloseLoop = 0;
		driveStatus.B.Sensorless = 0;
		driveStatus.B.NewZC = 0;

		/* Disable actuator */
		ACTUATE_DisableOutput();

		if (ReadAEStatus == 0) //wait till all relevant AE status words have been read in the background loop
		{
			AEFaultStatus.AEIntFlag = false;
		}

	}
    else
	{
    	faultStatus.B.AEFault = 0;
	}


    faultStatusLatched.R |= faultStatus.R;

    if (faultStatusLatched.R != 0)
    {
        driveStatus.B.Fault = 1;
        appSwitchState = 0;
        appState = APP_FAULT;
    }
    else
    {
        faultSwitchClear = 0;
    }

    }

/*FUNCTION**********************************************************************
 *
 * Function Name : AE_INT_Handler
 * Description   : INT pin IRQ handler.
 *
 *END**************************************************************************/
void AE_INT_Handler(void)
{
	//Set flag to read AE status - this is done in main() in the background loop
	/*This SW example stops the motor in case of any fault/event reported by AE through NMI/PTD3 line
	 * in case any application specific AE fault/event arbitration is desired, it needs to be implemented in addition
	 */

	Aec_Ip_SpiRead((uint32_t) &IP_AEC_AE->FAULTS_STATUS,16, &AEFaultStatus.AEFaultStatus);//read fault status
	//if there are any pending faults or events this is informed by Global Heald Status, in that case the rest of the
	//relevant status words is read in the background loop in main()

	AEHealthStatus = Aec_Ip_DecodeGlobalHealthStatus();
	AEHealthStatus &= (AEC_STATUS_EVENT_NOTIFY | AEC_STATUS_FAULT_NOTIFY );

	if (AEHealthStatus !=0)
	{
		//If there is a pending Fault or event in the AE, the flag is set and is further processed in FaultDetection()
		AEFaultStatus.AEIntFlag = 1;
		ReadAEStatus = 1;
	}
}

/*FUNCTION**********************************************************************
 *
 * Function Name : CheckSwitchState
 * Description   : User switch state detection function.
 *
 *END**************************************************************************/
void CheckSwitchState(void)
{
    if(switchOffCounter == 0)
    {
        /* Speed up or start the motor */
        if((Siul2_Dio_Ip_ReadPin(BTN_INC_SW0_PORT, BTN_INC_SW0_PIN) & 1))
        {
            switchCounter[0]++;

            if(switchCounter[0] > SW_PRESS_DEBOUNCE)
            {
                if(appSwitchState == 0)
                {
                	rotationDir = ROTATION_DIR_CW;
                    appSwitchState = 1;
                    switchOffCounter = SW_PRESS_OFF;
                }
                else
                {
                    requiredSpeed += SPEED_INC;
                }

                switchCounter[0] = 0;
            }
        }

        /* Speed down or start the motor */
        if((Siul2_Dio_Ip_ReadPin(BTN_DEC_SW1_PORT, BTN_DEC_SW1_PIN) & 1))
        {
            switchCounter[1]++;

            if(switchCounter[1] > SW_PRESS_DEBOUNCE)
            {
            	if(appSwitchState == 0)
            	{
            		rotationDir = ROTATION_DIR_CCW;
            	    appSwitchState = 1;
   	                switchOffCounter = SW_PRESS_OFF;
            	}
            	else
                {
            	    requiredSpeed -= SPEED_DEC;
                }

            	switchCounter[1] = 0;
            }
        }

        /* Clear faults or stop the motor */
        if((Siul2_Dio_Ip_ReadPin(BTN_INC_SW0_PORT, BTN_INC_SW0_PIN) & 1) && (Siul2_Dio_Ip_ReadPin(BTN_DEC_SW1_PORT, BTN_DEC_SW1_PIN) & 1))
        {
            if(appState == APP_FAULT)
            {
                faultSwitchClear = 1;
            }

            appSwitchState = 0;
            switchOffCounter = SW_PRESS_OFF;
        }
    }
    else
    {
        switchOffCounter--;
    }
}

void CheckFlexCANState(void)
{
	if(switchOffCounter == 0)
	{
			// Speed up or start the motor CW
			if(aRxDataBuffer->data[0] == (uint8_t)0x10)
			{
				if(appSwitchState == 0) //Start the motor clock wise
				{
					rotationDir = ROTATION_DIR_CW;
					appSwitchState = 1;
					switchOffCounter = SW_PRESS_OFF;
				}
				else //Increase the speed
				{
					requiredSpeed += SPEED_INC;
				}
			}


			//Speed down or start the motor CCW
			if(aRxDataBuffer->data[0] == (uint8_t)0x11)
			{
				if(appSwitchState == 0) //Start the motor counter clock wise
				{
					rotationDir = ROTATION_DIR_CCW;
					appSwitchState = 1;
					switchOffCounter = SW_PRESS_OFF;
				}
				else //Decrease the speed
				{
					requiredSpeed -= SPEED_INC;
				}
			}


			// Clear faults or stop the motor
			if(aRxDataBuffer->data[0] == (uint8_t)0x12)
			{
				if(appState == APP_FAULT)
				{
					faultSwitchClear = 1;
				}
				appSwitchState = 0;
				switchOffCounter = SW_PRESS_OFF;
			}

	}
	else
	{
		switchOffCounter--;
	}
}


#ifdef __cplusplus
}
#endif

/** @} */
