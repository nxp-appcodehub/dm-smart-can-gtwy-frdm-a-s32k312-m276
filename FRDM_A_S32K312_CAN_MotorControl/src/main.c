/*==================================================================================================
* Project : RTD AUTOSAR 4.9
* Platform : CORTEXM
* Peripheral : S32K3XX
* Dependencies : none
*
* Autosar Version : 4.9.0
* Autosar Revision : ASR_REL_4_9_REV_0000
* Autosar Conf.Variant :
* SW Version : 7.0.1
* Build Version : S32K3_RTD_7_0_1_D2602_ASR_REL_4_9_REV_0000_20260206
*
* Copyright 2020 - 2026 NXP
*
* NXP Proprietary. This software is owned or controlled by NXP and may only be
*   used strictly in accordance with the applicable license terms. By expressly
*   accepting such terms or by downloading, installing, activating and/or otherwise
*   using the software, you are agreeing that you have read, and that you agree to
*   comply with and are bound by, such license terms. If you do not agree to be
*   bound by the applicable license terms, then you may not retain, install,
*   activate or otherwise use the software.
==================================================================================================*/

/**
 *   @file main.c
 *
 *   @addtogroup main_module main module documentation
 *   @{
 */

/* Including necessary configuration files. */
#include "Mcal.h"
#include "Clock_Ip.h"
#include "Siul2_Port_Ip.h"
#include "Siul2_Dio_Ip.h"
#include "IntCtrl_Ip.h"
#include "FlexCAN_Ip.h"

#define CMD_REQ_ON			0xAA
#define CMD_REQ_OFF		0x55

#define MASTER_ID					0xC0FE
#define DEVICE_ID					0xC0FE

/* User switch debounce timeout */
#define SW_PRESS_DEBOUNCE                7500
/* User switch input blocking delay */
#define SW_PRESS_OFF                     25000

volatile uint8_t buffer_cmd[8];

/* For FLEXCAN */
Flexcan_Ip_MsgBuffType aRxDataBuffer[10U];
Flexcan_Ip_DataInfoType RxInfo = {
		.msg_id_type = FLEXCAN_MSG_ID_EXT,
		.data_length = 8U,
		.is_polling = TRUE,
		.is_remote = FALSE,
		.fd_enable = TRUE,
		.enable_brs = TRUE
};
Flexcan_Ip_DataInfoType TxInfo = {
		.msg_id_type = FLEXCAN_MSG_ID_EXT,
		.data_length = 8U,
		.is_polling = TRUE,
		.is_remote = FALSE,
		.fd_enable = TRUE,
		.enable_brs = TRUE
};
volatile boolean bTxFlag = FALSE;
volatile boolean bRxFlag = FALSE;

/* FlexCAN callback Routine */
void Callback_FlexCAN(uint8 instance,
		Flexcan_Ip_EventType eventType,
		uint32 buffIdx,
		const struct FlexCANState *driverState)
{
	if (FLEXCAN_EVENT_RX_COMPLETE == eventType)
	{
		/* Configure Rx message buffer */
		FlexCAN_Ip_ConfigRxMb(INST_FLEXCAN_0, 1U, &RxInfo, MASTER_ID);
		/* Prepare to receive the next message */
		FlexCAN_Ip_Receive(INST_FLEXCAN_0, 1U, &aRxDataBuffer[0], TRUE);

		bRxFlag = TRUE;
	}

	if (FLEXCAN_EVENT_TX_COMPLETE == eventType)
	{
		bTxFlag = TRUE;
	}
	(void)instance;
	(void)buffIdx;
	(void)driverState;
}

int main(void)
{

	volatile uint32_t      switchCounter[2] = {0,0}, switchOffCounter = 0;

	/* Initialize Clocks */
	Clock_Ip_Init(&Clock_Ip_aClockConfig[0]);

	/* Initialize Port Peripheral */
	Siul2_Port_Ip_Init(NUM_OF_CONFIGURED_PINS_PortContainer_0_BOARD_InitPeripherals,
			g_pin_mux_InitConfigArr_PortContainer_0_BOARD_InitPeripherals); /*This function configures the pins*/

	/* Initialize Interruptions */
	IntCtrl_Ip_Init(&IntCtrlConfig_0);

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
	FlexCAN_Ip_ConfigRxMb(INST_FLEXCAN_0, 1U, &RxInfo, MASTER_ID);

	/* Start trigger to receive messages */
	FlexCAN_Ip_Receive(INST_FLEXCAN_0, 1U, &aRxDataBuffer[0], TRUE);

	// CAN0_EN
	Siul2_Dio_Ip_WritePin(CAN0_EN_PORT, CAN0_EN_PIN, 1);

	// CAN0_STB
	Siul2_Dio_Ip_WritePin(CAN0_STB_PORT, CAN0_STB_PIN, 1);

	// Led Green OFF
	Siul2_Dio_Ip_WritePin(GREEN_PORT, GREEN_PIN, 1);
	// Led Blue OFF
	Siul2_Dio_Ip_WritePin(BLUE_PORT, BLUE_PIN, 1);

	for(;;)
	{

		if(switchOffCounter == 0)
		{
			// Speed up or start the motor CW
			if((Siul2_Dio_Ip_ReadPin(SW2_PORT, SW2_PIN) & 1))
			{
				switchCounter[0]++;

				if(switchCounter[0] > SW_PRESS_DEBOUNCE)
				{
					buffer_cmd[0] = 0x10;
					FlexCAN_Ip_Send(INST_FLEXCAN_0, 0U, &TxInfo, DEVICE_ID, (uint8*)buffer_cmd);

					while (FALSE == bTxFlag)
					{
						FlexCAN_Ip_MainFunctionWrite(INST_FLEXCAN_0, 0U);
					}
					bTxFlag = FALSE;

					switchCounter[0] = 0;
				}
			}

			//Speed down or start the motor CCW
			if((Siul2_Dio_Ip_ReadPin(SW3_PORT, SW3_PIN) & 1))
			{
				switchCounter[1]++;

				if(switchCounter[1] > SW_PRESS_DEBOUNCE)
				{
					buffer_cmd[0] = 0x11;
					FlexCAN_Ip_Send(INST_FLEXCAN_0, 0U, &TxInfo, DEVICE_ID, (uint8*)buffer_cmd);

					while (FALSE == bTxFlag)
					{
						FlexCAN_Ip_MainFunctionWrite(INST_FLEXCAN_0, 0U);
					}
					bTxFlag = FALSE;

					switchCounter[1] = 0;
				}
			}

			// Clear faults or stop the motor
			if(((Siul2_Dio_Ip_ReadPin(SW2_PORT, SW2_PIN) & 1)) && ((Siul2_Dio_Ip_ReadPin(SW3_PORT, SW3_PIN) & 1)))
			{
				buffer_cmd[0] = 0x12;
				FlexCAN_Ip_Send(INST_FLEXCAN_0, 0U, &TxInfo, DEVICE_ID, (uint8*)buffer_cmd);

				while (FALSE == bTxFlag)
				{
					FlexCAN_Ip_MainFunctionWrite(INST_FLEXCAN_0, 0U);
				}
				bTxFlag = FALSE;
				switchOffCounter = SW_PRESS_OFF;
			}
		}
		else
		{
			switchOffCounter--;
		}
	}
}

/** @} */
