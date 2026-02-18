/*******************************************************************************
*
* Copyright 2006-2015 Freescale Semiconductor, Inc.
* Copyright 2016-2017 NXP
*
****************************************************************************//*!
*
* @file   mainInclude.js
*
* @brief  javascrip engine for MC Tuning Wizard
*
* @version 1.0.1.0
* 
* @date May-6-2014
* 
******************************************************************************/

/******************************************************************************
* List of functions
******************************************************************************
* includeJSfiles() 
* build_includeFile_line(jsFileName)
*
*******************************************************************************/
 
/***************************************************************************//*!
*
* @brief   The function includes all required js files
* @param   
* @return  None
* @remarks 
******************************************************************************/
function includeJSfiles()
{
    build_includeFile_line('wizardConfig.js');
    build_includeFile_line('calculations.js');
    build_includeFile_line('fileProcessing.js');
    build_includeFile_line('hFileConfig.js');
    build_includeFile_line('settings.js');
    build_includeFile_line('inner_Parameters.js');
    build_includeFile_line('inner_CtrlLoop.js');
    build_includeFile_line('inner_TLoop.js');
    build_includeFile_line('inner_SLoop.js');
    build_includeFile_line('inner_Sensorless.js');
    build_includeFile_line('inner_Cascade.js');
}

/***************************************************************************//*!
*
* @brief   The function build script for including js file
* @param   
* @return  None
* @remarks Function required the same source folder
******************************************************************************/
function build_includeFile_line(jsFileName)
{
  document.write('<scr'+'ipt type="text/javascript" src="JS_functions/' + jsFileName + '" ></scr'+'ipt>');    
}


/***************************************************************************//*!
* 
******************************************************************************
* End of code
******************************************************************************/
 