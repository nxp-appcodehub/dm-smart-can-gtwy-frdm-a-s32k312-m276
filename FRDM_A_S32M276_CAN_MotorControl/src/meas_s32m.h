/******************************************************************************
*   Project      : S32M27xEVB_BLDC_6step_sensorless
*   Revision     : 1.0
*   RTD Version  : 4.0.0
*   Brief description  :
*   File contains declarations for functions related to analog quantities capturing.
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
 * meas_s32m.h
 *
 * rev 1.0 Initial release
 ******************************************************************************/
#ifndef _MEAS_S32K_H_
#define _MEAS_S32K_H_

/*==================================================================================================
*                                        INCLUDE FILES
==================================================================================================*/
#include "Adc_Sar_Ip.h"
#include "Bctu_Ip.h"
#include "config\BLDC_appconfig.h"
#include "gdflib.h"
#include "gflib.h"
#include "gmclib.h"

/*==================================================================================================
*                              STRUCTURES AND OTHER TYPEDEFS
==================================================================================================*/

/*------------------------------------------------------------------------*//*!
@brief  Structure containing values
*//*-------------------------------------------------------------------------*/


/*==================================================================================================
                                     FUNCTION PROTOTYPES
==================================================================================================*/

extern tBool MEAS_GetUdcVoltage(tFloat *ptr);
extern tBool MEAS_GetIdcCurrent(tFloat *ptr);
extern tBool MEAS_GetBEMFVoltage(tFloat *BEMFVoltage);


#endif /* _MEAS_S32K_H_ */
