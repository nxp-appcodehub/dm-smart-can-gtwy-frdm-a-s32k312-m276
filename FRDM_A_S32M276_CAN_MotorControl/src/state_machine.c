/*******************************************************************************
*   Project      : S32M27xEVB_BLDC_6step_sensorless
*   Revision     : 1.0
*   RTD Version  : 4.0.0
*   Brief description  :
*   File contains definition of the application state machine.
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
 * state_machine.c
 *
 * rev 1.0 Initial release
 *
 ********************************************************************************/
/*==================================================================================================
*                                        INCLUDE FILES
==================================================================================================*/
#include "state_machine.h"

/*==================================================================================================
*                                      GLOBAL VARIABLES
==================================================================================================*/

/* Array with pointers to the state machine functions */
const tPointerFcn AppStateMachine[] = \
{
    AppInit,                    // #0
    AppCalib,                   // #1
    AppAlignment,               // #2
    AppStart,                   // #3
    AppRun,                     // #4
    AppStop,                    // #5
    AppFault                    // #6
};


