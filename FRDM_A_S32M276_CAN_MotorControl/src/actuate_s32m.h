/*******************************************************************************
*   Project      : S32M27xEVB_BLDC_6step_sensorless
*   Revision     : 1.0
*   RTD Version  : 4.0.0
*   Brief description  :
*   File contains declarations for functions needed for inverter voltage control.
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
 * actuate_S32m.h
 *
 * rev 1.0 Initial release
 *
 ********************************************************************************/
#ifndef _ACTUATE_S32K_H_
#define _ACTUATE_S32K_H_

/*==================================================================================================
*                                        INCLUDE FILES
==================================================================================================*/
#include "Emios_Mcl_Ip.h"
#include "Emios_Pwm_Ip.h"
#include "gflib.h"
#include "gdflib.h"
#include "gmclib.h"
#include "Lcu_Ip.h"

extern Lcu_Ip_SyncInputValueType InputSector[4];

/*==================================================================================================
                                     FUNCTION PROTOTYPES
==================================================================================================*/

extern tBool ACTUATE_EnableOutput(void);
extern tBool ACTUATE_DisableOutput(void);
extern tBool ACTUATE_SetDutycycleAndTrigger(tFloat fltpwm, tFloat flttrigger);

#endif /* _ACTUATES_S32K_H_ */
