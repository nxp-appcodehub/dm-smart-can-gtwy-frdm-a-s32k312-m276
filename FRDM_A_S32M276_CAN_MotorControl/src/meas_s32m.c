/******************************************************************************
*   Project      : S32M27xEVB_BLDC_6step_sensorless
*   Revision     : 1.0
*   RTD Version  : 4.0.0
*   Brief description  :
*   File contains definition of functions related to analog quantities capturing.
*
*   Copyright 2025 NXP
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
 * meas_s32m.c
 *
 * rev 1.0 Initial release
 *
 ********************************************************************************/
/*==================================================================================================
*                                        INCLUDE FILES
==================================================================================================*/
#include "meas_s32m.h"
#include "motor_structure.h"

/*==================================================================================================
*                                      GLOBAL VARIABLES
==================================================================================================*/
extern volatile Bctu_Ip_FifoResultType measuredValues[16];

/*==================================================================================================
*                                    FUNCTIONS DEFINITION
==================================================================================================*/

/*FUNCTION**********************************************************************
 *
 * Function Name : MEAS_GetIdcCurrent
 * Description   : This function performs measurement of DCB currents from
            	   the shunt resistor.
 *
 *
 *END**************************************************************************/
tBool MEAS_GetIdcCurrent(tFloat *ptr)
{
    uint16_t DCBus_Current = 0;

    DCBus_Current = Adc_Sar_Ip_GetConvData(1U, 32U);
    *ptr = MLIB_Mul(((tFloat)MLIB_Div((tFloat)( DCBus_Current & 0x00003FFF), (tFloat)0x00003FFF)), I_MAX * 2.0F);
    return (TRUE);
}

/*FUNCTION**********************************************************************
 *
 * Function Name : MEAS_GetUdcVoltage
 * Description   : This function performs measurement of DCBus Voltage.
 *
 *END**************************************************************************/
tBool MEAS_GetUdcVoltage(tFloat *ptr)
{
	uint16_t DCBus_Voltage;
	Bctu_Ip_ResultType Result;
	Bctu_Ip_GetConvResult(0,1,&Result);
	DCBus_Voltage = Bctu_Ip_GetConvData(0U, 1U);
    *ptr = MLIB_Mul(((tFloat)MLIB_Div((tFloat)(DCBus_Voltage & 0x00003FFF), (tFloat)0x00003FFF)), U_DCB_MAX);

    return (TRUE);
}

/*FUNCTION**********************************************************************
 *
 * Function Name : MEAS_GetBEMFVoltage
 * Description   : This function performs measurement of BEMF Voltage.
 *
 *END**************************************************************************/

tBool MEAS_GetBEMFVoltage(tFloat *BEMFVoltage)
{
	uint16_t rawBemf = 0;
    Bctu_Ip_ResultType Result1;
	Bctu_Ip_GetConvResult(0,0,&Result1);
    rawBemf = Bctu_Ip_GetConvData(0U, 0U);
    *BEMFVoltage = MLIB_Mul(((tFloat)MLIB_Div((tFloat)(rawBemf & 0x00003FFF), (tFloat)0x00003FFF)), U_DCB_MAX);

    return (TRUE);
}


