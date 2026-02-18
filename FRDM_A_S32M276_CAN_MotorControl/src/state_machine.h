/*******************************************************************************
*   Project      : S32M27xEVB_BLDC_6step_sensorless
*   Revision     : 1.0
*   RTD Version  : 4.0.0
*   Brief description  :
*   File contains declarations for the application state machine.
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
 * state_machine.h
 *
 * rev 1.0 Initial release
 *
 ********************************************************************************/
#ifndef _STATE_MACHINE_FRAME_H
#define _STATE_MACHINE_FRAME_H

/*==================================================================================================
*                                       LOCAL MACROS
==================================================================================================*/
#define APP_INIT                0   /* Application states */
#define APP_CALIB               1
#define APP_ALIGNMENT           2
#define APP_START               3
#define APP_RUN                 4
#define APP_STOP                5
#define APP_FAULT               6

/*==================================================================================================
*                              STRUCTURES AND OTHER TYPEDEFS
==================================================================================================*/
typedef void (*tPointerFcn)(void);  /* pointer to a function */
typedef void (*tPointerStr)(void);  /* pointer to a structure */

/*------------------------------------------------------------------------*//*!
@brief  Exported Variables
*//*-------------------------------------------------------------------------*/
/* Array with pointers to the state machine functions */
extern const tPointerFcn AppStateMachine[];
/* Array with pointers to the RGB Led state functions */
extern const tPointerFcn AppStateLed[];

/*==================================================================================================
                                    FUNCTION PROTOTYPES
==================================================================================================*/
/* Application control*/

extern void AppInit(void);
extern void AppCalib(void);
extern void AppAlignment(void);
extern void AppStart(void);
extern void AppRun(void);
extern void AppStop(void);
extern void AppFault(void);

extern void AppStopToAlignment(void);
extern void AppAlignmentToStart(void);
extern void AppStartToRun(void);

extern void CheckFaults(void);
extern void CheckSwitchState(void);
extern void CheckFlexCANState(void);
extern void StallCheck(void);

#endif //_STATE_MACHINE_FRAME_H
