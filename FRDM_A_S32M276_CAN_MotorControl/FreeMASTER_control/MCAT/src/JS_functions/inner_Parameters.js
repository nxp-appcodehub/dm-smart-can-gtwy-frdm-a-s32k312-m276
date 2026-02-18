/*******************************************************************************
*
* Copyright 2006-2015 Freescale Semiconductor, Inc.
* Copyright 2016-2017 NXP
*
****************************************************************************//*!
*
* @file   inner_Parameters.js
*
* @brief  javascrip engine for MC Tuning Wizard
*
* @version 1.0.2.0
* 
* @date Jul-4-2014
* 
******************************************************************************/

/******************************************************************************
* List of functions
******************************************************************************
*  initLoadFormParamValues()
*  writeParametersHTMLOutput(prefix,xmlObject)
*  writeParametersHeaderOutput(str)
*  writeFMScalesHTMLOutput(prefix,xmlObject)
*  writeFMScalesHeaderOutput(str)
*
*******************************************************************************/

/***************************************************************************//*!
/***************************************************************************//*!
*
* @brief  The function loads values from inner storage table to forms based
*         on parameter ID
* @param   
* @return 
* @remarks 
******************************************************************************/
 function initLoadFormParamValues()
 {
    
    // in basic mode, precalculate paramters
    if(getActiveMode()==0)
      basicModeCalcParam();

    
    // mandatory input parameters
    copyParent2InnerValById("pp");
   
    copyParent2InnerValById("I_ph_nom");
    copyParent2InnerValById("U_ph_nom");
    copyParent2InnerValById("N_nom");
    
    copyParent2InnerValById("I_max");
    copyParent2InnerValById("UDC_max");
    
    // fault limits
    copyParent2InnerValById("IDC_over");
    copyParent2InnerValById("UDC_under");
    copyParent2InnerValById("UDC_over");
    
    // precalculated or manualy added
    copyParent2InnerValById("UDC_trip");
    copyParent2InnerValById("IDC_limit");
    copyParent2InnerValById("N_max"); 
    copyParent2InnerValById("ke");         
    copyParent2InnerValById("PWM_freq");
    
    copyParent2InnerValById("ALIGN_U");
    copyParent2InnerValById("ALIGN_I");
    copyParent2InnerValById("ALIGN_T");
    
    
    if(testVarValue('Alignment','Voltage'))
    {
      document.getElementById("Volt_align").style.display = "";
      document.getElementById("Curr_align").style.display = "none";
    }
    else
    {
      document.getElementById("Volt_align").style.display = "none";
      document.getElementById("Curr_align").style.display = "";
    }
    // enable button enabling
    ReloadStoreButtonsOnOff(1);
    
    //calculate constants
    clickCalculateParam();
}

/***************************************************************************//*!
*
* @brief   Parameter Calculation in BASIC mode
* @param   
* @return  None
* @remarks 
******************************************************************************/
function basicModeCalcParam()
{
    var UDCB_max      = getParentHtmlValue("UDC_max");
    var N_req_max     = getParentHtmlValue("N_nom");       
    var I_nom         = getParentHtmlValue("I_ph_nom");
    var U_nom         = getParentHtmlValue("U_ph_nom");
    var Imax          = getParentHtmlValue("I_max");
    var pp            = getParentHtmlValue("pp");
    var N_nom         = getParentHtmlValue("N_nom");
    var PWM_freq      = getParentHtmlValue("PWM_freq");
    
    // calculated input parameters
    IDCB_over = (Imax*0.8).toFixed(1);
    UDCB_under = (UDCB_max*0.4).toFixed(1);
    UDCB_over = (UDCB_max*0.8).toFixed(1)
    UDCB_trip = (UDCB_max*0.8).toFixed(1);
    IDCB_limit = (I_nom*2.5).toFixed(1);
    N_max =   (1.1*N_req_max).toFixed(1);
    ke = (U_nom/(2*Math.PI*pp*N_nom/60)).toFixed(5);
    U_align = (U_nom*0.1).toFixed(1);
    I_align = (I_nom*2).toFixed(2);
    // default alignment time 1sec
    T_align = 1;
    
    
    // replace and disable params
    switchParam2BasicMode("IDC_over",IDCB_over);
    switchParam2BasicMode("UDC_under",UDCB_under);
    switchParam2BasicMode("UDC_over",UDCB_over);
    switchParam2BasicMode("IDC_limit",IDCB_limit);
    switchParam2BasicMode("UDC_trip",UDCB_trip);
    switchParam2BasicMode("N_max",N_max);
    switchParam2BasicMode("ke",ke);
    switchParam2BasicMode("PWM_freq",PWM_freq);
    switchParam2BasicMode("ALIGN_U",U_align);
    switchParam2BasicMode("ALIGN_I",I_align);
    switchParam2BasicMode("ALIGN_T",T_align);
    
    // disable button FRM Update
    document.getElementById("ParamUpdateFrm").disabled = true;

}

/***************************************************************************//*!
*
* @brief  The function calculates ouput constans based on input parameters   
* @param   
* @return  None
* @remarks 
******************************************************************************/
function clickCalculateParam()
{
    Align_volt        = getParentHtmlValue("ALIGN_U"); //need to be global var
    Align_cur         = getParentHtmlValue("ALIGN_I"); //need to be global var
    
    var CtrlLOOP_Ts   = getParentHtmlValue("CtrlLOOP_Ts");
    var Align_dur     = getParentHtmlValue("ALIGN_T");
    var Imax          = getParentHtmlValue("I_max");
    var UDCmax        = getParentHtmlValue("UDC_max");
    var Nmax          = getParentHtmlValue("N_max");
    var UDCtrip       = getParentHtmlValue("UDC_trip"); 
    var IDClimit       = getParentHtmlValue("IDC_limit");
    var UDCunder      = getParentHtmlValue("UDC_under");
    var UDCover       = getParentHtmlValue("UDC_over");
    var IDCover       = getParentHtmlValue("IDC_over");
    var Nreqmax       = getParentHtmlValue("N_nom");
    var IphLim        = getParentHtmlValue("I_ph_nom");
    var Uphnom        = getParentHtmlValue("U_ph_nom");
    
    /* voltage alignemt scale changed to Uphnom due to Auto team requirements */
    Align_volt_sc = (Align_volt/Uphnom).toFixed(12);
    testValRange("Aling voltage",Align_volt,0,Uphnom); 
    Align_cur_sc = (Align_cur/Imax).toFixed(12);
    testValRange("Align_current",Align_cur,0,Imax);
    Align_dur_sc =  (Align_dur/0.00005).toFixed(0);
    testValRange("Align_duration",Align_dur,0.1,30);
    
    IDC_over_sc = (IDCover/Imax).toFixed(12);
    testValRange("IDCB_over",IDCover,0,Imax);
    IDC_limit_sc = (IDClimit/Imax).toFixed(12);
    testValRange("IDCB_limit",IDClimit,0,Imax);
    UDC_trip_sc = (UDCtrip/UDCmax).toFixed(12);
    testValRange("UDCB_trip",UDCtrip,0,UDCmax);
    UDC_under_sc = (UDCunder/UDCmax).toFixed(12);
    testValRange("UDCB_under",UDCunder,0,UDCmax);
    UDC_over_sc = (UDCover/UDCmax).toFixed(12);
    testValRange("UDCB_over",UDCover,0,UDCmax);
    N_req_max_sc = (Nreqmax/Nmax).toFixed(12);
    testValRange("N_nom",Nreqmax,0,Nmax);
    I_ph_lim_sc = (IphLim/Imax).toFixed(12);
    testValRange("Iph_nom",IphLim,0,Imax);
    U_ph_nom_sc = (Uphnom/UDCmax).toFixed(12);
    testValRange("Uph_nom",Uphnom,0,UDCmax);
      
    
    // If PARAMETERS tab is active ******************************************
    if(document.getElementById("HeaderFileTab") != undefined)
    {
      // write maximal scales to forms in Output File HTML page
      setInnerHtmlValueAsText("I_MAX",5,Imax, Imax);
      setInnerHtmlValueAsText("U_DCB_MAX",5,UDCmax, UDCmax);
      setInnerHtmlValueAsText("N_MAX",5,Nmax, Nmax);
      
      setInnerHtmlValueAsText("I_DCB_OVERCURRENT",0,IDC_over_sc, IDCover);
      setInnerHtmlValueAsText("U_DCB_UNDERVOLTAGE",0,UDC_under_sc, UDCunder);
      setInnerHtmlValueAsText("U_DCB_OVERVOLTAGE",0,UDC_over_sc, UDCover);
      
      setInnerHtmlValueAsText("I_DCB_LIMIT",0,IDC_limit_sc, IDClimit);
      setInnerHtmlValueAsText("U_DCB_TRIP",0,UDC_trip_sc, UDCtrip);
      setInnerHtmlValueAsText("N_NOM",0, N_req_max_sc, Nreqmax);
      setInnerHtmlValueAsText("I_PH_NOM",0,I_ph_lim_sc,IphLim);
      setInnerHtmlValueAsText("U_PH_NOM",0,U_ph_nom_sc,Uphnom);
    
      // write values to forms in Output File Html page
      if(testVarValue('Alignment','Voltage'))
        setInnerHtmlValueAsText("ALIGN_VOLTAGE",0,Align_volt_sc, Align_volt);
      else
        setInnerHtmlValueAsText("ALIGN_CURRENT",0,Align_cur_sc, Align_cur);  
      
      setInnerHtmlValueAsText("ALIGN_DURATION",2,Align_dur_sc);
      
    }  
}
/***************************************************************************//*!
*
* @brief   update variables in FreeMASTER application
* @param   
* @return  None
* @remarks 
******************************************************************************/
function clickUpdateParamFM(){
    
    var errorArray = [];
   
    xmlDoc=loadXMLDoc("xml_files\\FM_params_list.xml"); 
    
    //calculate constants
    clickCalculateParam();
    
    if(testVarValue('Alignment','Voltage'))
      errorArray.push(UpdateFMVariable(xmlDoc,'Align_Voltage',Align_volt,Align_volt));
    else
      errorArray.push(UpdateFMVariable(xmlDoc,'Align_Current',Align_cur,Align_cur_sc));
   
    // alignment duration
    errorArray.push(UpdateFMVariable(xmlDoc,'Align_Duration',Align_dur_sc,Align_dur_sc));
    
    // display error message if any error detected
    UpdateError(errorArray);                            
 }
/***************************************************************************//*!
*
* @brief  The function reads values from input forms, scales them and write 
*         to output HTML form
* @param   
* @return 
* @remarks 
******************************************************************************/
function writeParametersHTMLOutput(prefix,xmlObject)
{
    document.write(HTML_write_blank_line());
    document.write(HTML_write_comment_line("Motor Parameters","",""));
    document.write(HTML_write_comment_line_dash());
    document.write(HTML_write_comment_line("Pole-pair numbers","pp",""));
    document.write(HTML_write_comment_line("Back-EMF constant","ke",""));
    document.write(HTML_write_comment_line("Phase current nominal","I_nom",""));
    document.write(HTML_write_comment_line("Phase voltage nominal","U_nom",""));
    document.write(HTML_write_comment_line("Speed motor nominal","N_mech_nom",""));
    document.write(HTML_write_comment_line_dash());
    document.write(HTML_write_blank_line());
    document.write(HTML_write_comment_line("Application Scales","",""));
    document.write(HTML_write_comment_line_dash());
    document.write(HTML_write_define_line_number(prefix,0,"I_MAX",xmlObject));
    document.write(HTML_write_define_line_number(prefix,0,"U_DCB_MAX",xmlObject));
    document.write(HTML_write_define_line_number(prefix,0,"N_MAX",xmlObject));
    document.write(HTML_write_blank_line());
    document.write(HTML_write_define_line_number(prefix,0,"I_DCB_OVERCURRENT",xmlObject));
    document.write(HTML_write_define_line_number(prefix,0,"U_DCB_UNDERVOLTAGE",xmlObject));
    document.write(HTML_write_define_line_number(prefix,0,"U_DCB_OVERVOLTAGE",xmlObject));
    document.write(HTML_write_blank_line());
    document.write(HTML_write_define_line_number(prefix,0,"I_DCB_LIMIT",xmlObject));
    document.write(HTML_write_define_line_number(prefix,0,"U_DCB_TRIP",xmlObject));
    document.write(HTML_write_define_line_number(prefix,0,"N_NOM",xmlObject));
    document.write(HTML_write_define_line_number(prefix,0,"I_PH_NOM",xmlObject));
    document.write(HTML_write_define_line_number(prefix,0,"U_PH_NOM",xmlObject));

    document.write(HTML_write_blank_line());
    document.write(HTML_write_comment_line("Mechanical alignment","",""));
    document.write(HTML_write_comment_line_dash());
    
    // Alignment control              
    document.write(HTML_write_define_line_number(prefix,0,"ALIGN_DURATION",xmlObject));
    if(testVarValue('Alignment','Voltage'))
      document.write(HTML_write_define_line_number(prefix,0,"ALIGN_VOLTAGE",xmlObject));
    else  
      document.write(HTML_write_define_line_number(prefix,0,"ALIGN_CURRENT",xmlObject));
        
    // motor parameters commented
    copyParent2HeaderCfgById('pp','pp',' [-]',true);
    copyParent2HeaderCfgById('ke','ke',' [V.sec/rad]',true);
    copyParent2HeaderCfgById('I_nom','I_ph_nom',' [A]',true);
    copyParent2HeaderCfgById('U_nom','U_ph_nom',' [V]',true);
    copyParent2HeaderCfgById('N_mech_nom','N_nom',' [rpm]',true);
    
    //calculate constants
    clickCalculateParam();
}

/***************************************************************************//*!
*
* @brief  The function reads values from input forms, scales them and write 
*         to output file form
* @param   
* @return 
* @remarks 
******************************************************************************/
function writeParametersHeaderOutput(str)
{
     str = write_blank_lines(str,1);     
     str = write_comment_text(str,'Motor Parameters','');
     str = write_comment_line_dash(str);
     str = write_comment_text(str,'Pole-pair number','pp');
     str = write_comment_text(str,'Back-EMF constant','ke');
     str = write_comment_text(str,'Phase current nominal','I_ph_nom');
     str = write_comment_text(str,'Phase voltage nominal','U_ph_nom');
     str = write_comment_line_dash(str);
     
     str = write_blank_lines(str,1);
     str = write_comment_text(str,'Application scales','');   
     str = write_define_line_number(str,'I_MAX');
     str = write_define_line_number(str,'U_DCB_MAX');
     str = write_define_line_number(str,'N_MAX');
                                            
     str = write_define_line_number(str,'I_DCB_OVERCURRENT');
     str = write_define_line_number(str,'U_DCB_UNDERVOLTAGE');
     str = write_define_line_number(str,'U_DCB_OVERVOLTAGE');
     str = write_define_line_number(str,'I_DCB_LIMIT');
     str = write_define_line_number(str,'U_DCB_TRIP');
     str = write_define_line_number(str,'N_NOM');
     str = write_define_line_number(str,'I_PH_NOM');
     str = write_define_line_number(str,'U_PH_NOM');
     
     str = write_comment_text(str,'Mechanical Alignment',''); 
     str = write_define_line_number(str,'ALIGN_CURRENT');
     str = write_define_line_number(str,'ALIGN_VOLTAGE');
     str = write_define_line_number(str,'ALIGN_DURATION');
     
     return str;
}

/***************************************************************************//*!
*
* @brief  The function reads values from input forms, scales them and write 
*         to output HTML form
* @param   
* @return 
* @remarks 
******************************************************************************/
function writeFMScalesHTMLOutput(prefix,xmlObject)
{
    // FreeMASTER Scale Variables  
    document.write(HTML_write_blank_line());
    document.write(HTML_write_comment_line("FreeMASTER Scale Variables","",""));
    document.write(HTML_write_comment_line_dash()); 
    document.write(HTML_write_define_line_number(prefix,0,"FM_I_SCALE",xmlObject));
    document.write(HTML_write_define_line_number(prefix,0,"FM_U_DCB_SCALE",xmlObject));
    document.write(HTML_write_define_line_number(prefix,0,"FM_N_SCALE",xmlObject));
    
    calcFmScaleVariable("FM_I_SCALE", "I_max");
    calcFmScaleVariable("FM_U_DCB_SCALE", "UDC_max");
    calcFmScaleVariable("FM_N_SCALE", "N_max");
}

/***************************************************************************//*!
*
* @brief  The function reads values from input forms, scales them and write 
*         to output file form
* @param   
* @return 
* @remarks 
******************************************************************************/
function writeFMScalesHeaderOutput(str)
{
     str = write_blank_lines(str,1);    
     str = write_comment_text(str,'FreeMASTER Scale Variables','','');
     str = write_comment_line_dash(str);
     str = write_comment_text(str,'Note: Scaled at input = 1000','','');    
     str = write_comment_line_dash(str);
     
     str = write_define_line_number(str,'FM_I_SCALE');
     str = write_define_line_number(str,'FM_U_DCB_SCALE');
     str = write_define_line_number(str,'FM_N_SCALE');
     
     return str;

}

/***************************************************************************//*!
*
* @brief  Unified function updating constants on active tab
* @param   
* @return 
* @remarks 
******************************************************************************/
function updateTab_Parameters()
{
   // update constants
   initLoadFormParamValues();
}


/***************************************************************************//*!
* 
******************************************************************************
* End of code
******************************************************************************/
