/**********************************************************************/
// File Name: {FM_project_loc}/../src/config/BLDC_appconfig.h 
//
// Date:  29. January, 2025
//
// Automatically generated file for static configuration of the BLDC application
/**********************************************************************/

#ifndef __BLDC_CONFIG_SETUP_H
#define __BLDC_CONFIG_SETUP_H


//Motor Parameters                      
//----------------------------------------------------------------------
//Pole-pair number                      = 2 [-]
//Back-EMF constant                     = 0.005872 [V.sec/rad]
//Phase current nominal                 (6.0F)
//Phase voltage nominal                 (12.0F)
//----------------------------------------------------------------------

//Application scales                    
#define I_MAX                           (15.625F)
#define U_DCB_MAX                       (22.1F)
#define N_MAX                           (5000.0F)
#define I_DCB_OVERCURRENT               (8.0F)
#define U_DCB_UNDERVOLTAGE              (9.0F)
#define U_DCB_OVERVOLTAGE               (18.0F)
#define I_DCB_LIMIT                     (6.0F)
#define U_DCB_TRIP                      (20.0F)
#define N_NOM                           (4500.0F)
#define I_PH_NOM                        (6.0F)
#define U_PH_NOM                        (12.0F)
//Mechanical Alignment                  
#define ALIGN_VOLTAGE                   (1.0F)
#define ALIGN_DURATION                  (20000)

//BLDC Control Loop                     
//----------------------------------------------------------------------
//Loop sample time                      = 0.001 [sec]
//----------------------------------------------------------------------
//Control loop limits                   
#define CTRL_LOOP_LIM_HIGH              (90.0F)
#define CTRL_LOOP_LIM_LOW               (10.0F)

#define SPEED_LOOP_KP_GAIN              (0.000020000000F)
#define SPEED_LOOP_KI_GAIN              (0.000030000000F)

//Speed ramp increments                 
#define SPEED_LOOP_RAMP_UP              (2.0F)
#define SPEED_LOOP_RAMP_DOWN            (2.0F)

//Torque Controller - Parallel type     
#define TORQUE_LOOP_KP_GAIN             (0.05F)
#define TORQUE_LOOP_KI_GAIN             (0.015F)
#define TORQUE_LOOP_MAF                 (0.03125F)

//Sensorless Control Module             
//----------------------------------------------------------------------
//Timer Frequency                       = 625000 [Hz]
//----------------------------------------------------------------------
#define N_MIN                           (800.0F)
#define N_START_TRH                     (600.0F)
#define STARTUP_CMT_CNT                 (20)
#define STARTUP_CMT_PER                 (12500)
#define CMT_T_OFF                       (20.0F)
#define FREEWHEEL_T_LONG                (500)
#define FREEWHEEL_T_SHORT               (250)
#define SPEED_SCALE_CONST               (3750)
#define CMT_PER_MIN                     (625)
#define START_CMT_ACCELER               (0.954968138423F)
#define INTEG_TRH                       (0)

//FreeMASTER Scale Variables            
//----------------------------------------------------------------------
//Note: Scaled at input = 1000          
//----------------------------------------------------------------------
#define FM_I_SCALE                      (15625)
#define FM_U_DCB_SCALE                  (22100)
#define FM_N_SCALE                      (5000000)

#endif
/**********************************************************************/
/**********************************************************************/
