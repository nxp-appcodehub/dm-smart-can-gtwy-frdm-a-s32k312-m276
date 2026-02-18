/*******************************************************************************
*   Project      : S32M27xEVB_BLDC_6step_sensorless
*   Revision     : 1.0
*   RTD Version  : 4.0.0
*   Brief description  :
*   File contains declaration of application structures used for motor control.
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
 * motor_structure.h
 *
 * rev 1.0 Initial release
 *
 ********************************************************************************/
#ifndef _MOTOR_STRUCTURE_H
#define _MOTOR_STRUCTURE_H

/******************************************************************************
* Includes
******************************************************************************/
#include "amclib.h"
#include "gdflib.h"
#include "gflib.h"
#include "gmclib.h"
#include "state_machine.h"

/*==================================================================================================
*                              STRUCTURES AND OTHER TYPEDEFS
==================================================================================================*/

/*------------------------------------------------------------------------*//*!
@brief  Structure containing position/speed module variables
*//*-------------------------------------------------------------------------*/
typedef union {
    uint16_t R;
    struct {
        uint16_t Alignment:1;
        uint16_t Sensorless:1;
        uint16_t StallCheckReq:1;
        uint16_t EnableCMT:1;
        uint16_t AfterCMT:1;
        uint16_t CloseLoop:1;
        uint16_t NewZC:1;
        uint16_t AdcSaved:1;
        uint16_t CurrentLimiting:1;
        uint16_t Fault:1;
        uint16_t Freewheeling:1;
        uint16_t Calib:1;
        uint16_t HallEvent:1;
        uint16_t Reserved:3;
    }B;
}tDriveStatus;

typedef union {
    uint8_t R;
    struct {
        uint8_t OverDCBusCurrent:1;
        uint8_t OverDCBusVoltage:1;
        uint8_t UnderDCBusVoltage:1;
        uint8_t AEFault:1;
        uint8_t StallError:1;
        uint8_t Reserved:3;
    }B;
}tFaultStatus;

typedef struct {
    tFloat BEMFVoltage;
    tFloat DCBVVoltage;
    tFloat DCBIVoltage;
    tFloat DCBIVoltageRaw;
    tFloat DCBIOffset;
}tADCresults;

typedef struct {
    uint8_t     InA;
    uint8_t     InB;
    uint8_t     InC;
    uint8_t     InABC;
    uint8_t     Sector;
    uint16_t    Period[6];
}tSensorHall;


typedef struct
{
    tBool                     AEIntFlag;
    uint32                    AEEventStatus;
    uint32                    AEFaultStatus;
    uint32                    HVMInterruptFlags;
    uint32                    PMCMonitorRegister;
    uint32                    GDUInterruptFlag;
    uint32                    DPGAInterruptFlag;
}AEFaultStatus_t;

#endif /* _MOTOR_STRUCTURE */
