/*******************************************************************************
*
* Copyright 2006-2015 Freescale Semiconductor, Inc.
* Copyright 2016-2017 NXP
*
****************************************************************************//*!
*
* @file   inner_SLoop.js
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
* initLoadFormSloop() - init Speed Loop control page paramters and constants  
* clickCalculateSloop() - calculates control constants based on input parameters
* clickUpdateSloopFM() - update selected variables in FreeMASTER application
* writeSLoopHTMLOutput(prefix,xmlObject) - write selected constants to output preview page 
* writeSLoopHeaderOutput(str,prefix) - write selected constants to output header file
*******************************************************************************/
/***************************************************************************//*!
*
* @brief  The function loads values from inner storage table to forms based
*         on parameter ID 
* @param   
* @return 
* @remarks 
******************************************************************************/
function initLoadFormSloop()
{
    var ControllerType = null;
    
    // in basic mode, precalculate paramters
    if(getActiveMode()==0)
      basicModeCalcSLoop();
    
    copyParent2InnerValById("SLOOP_F0");   
    copyParent2InnerValById("SLOOP_Att");
    copyParent2InnerValById("SLOOP_Ts");

    copyParent2InnerValById("RAMP_UP");   
    copyParent2InnerValById("RAMP_DOWN");
    copyParent2InnerValById("SPEED_MAF"); 
    copyParent2InnerValById("SPEED_IIR_FREQ");
    
    copyParent2InnerValById("SLOOP_LIM_HIGH");   
    copyParent2InnerValById("SLOOP_LIM_LOW");
   
    // display only required type of Speed filter
    if(testVarValue('WFilt','MA Filter'))
    {
      document.getElementById("SpeedFilterIIR").style.display = "none";
      document.getElementById("Speed_IIR_filt").style.display = "none";
 // debug, added due to P. Stazsko requirement     
      document.getElementById("SpeedFilterMAF").style.display = "none"; 
    }
    else
    {
      document.getElementById("SpeedFilterIIR").style.display = "";
      document.getElementById("Speed_IIR_filt").style.display = "";
      document.getElementById("SpeedFilterMAF").style.display = "none";
    }
  
    // display only required type of PI controller
    if(testVarValue('Scontroller','Parallel'))
    {
        document.getElementById("Speed_PIparal").style.display = "";
        document.getElementById("Speed_PIrecur").style.display = "none";   
        ControllerType = 'Parallel';    
    }
    else
    {
        document.getElementById("Speed_PIparal").style.display = "none";
        document.getElementById("Speed_PIrecur").style.display = "";
        ControllerType = 'Reccurent';
    }
    
    // display Speed ramp constants
    if(testVarValue('FFw_SL','Incremental Ramp'))
    { 
        document.getElementById("SpeedRamp").style.display = "";
    }    
    else
    {
        document.getElementById("SpeedRamp").style.display = "none";
    }   

    document.getElementById("Scontroller").innerText = ControllerType;    
    
    // enable button enabling
    ReloadStoreButtonsOnOff(1);
   
    // check manual tuning mode
    //get active motor to select proper prefix
    var prefixM = getActiveMotor();
    if(parent.document.getElementById(prefixM + 'SLOOP_PI_MAN_EN').innerHTML==1)
    {
      copyParent2InnerValById("SLOOP_KP_MAN");
      copyParent2InnerValById("SLOOP_KI_MAN");
      document.getElementById(prefixM+'SL_PImanualTuning').checked=true;
    }
    else
      document.getElementById(prefixM+'SL_PImanualTuning').checked=false;  
    
    
    //calculate constants
    clickCalculateSloop();  
    
    //manual tunning function
    SL_PImanualTuning();
}

/***************************************************************************//*!
*
* @brief   Parameter Calculation in BASIC mode
* @param   
* @return  None
* @remarks 
******************************************************************************/
function basicModeCalcSLoop()
{
    var Rs            = getParentHtmlValue("Rs");
    var I_ph          = getParentHtmlValue("I_ph");
    var SLOOP_Ts      = getParentHtmlValue("SLOOP_Ts");
    var TLOOP_fo      = getParentHtmlValue("TLOOP_F0");
    
    // calculated input parameters
    SLoop_bandwidth = (TLOOP_fo/10).toFixed(0);
    
    // replace and disable params
    switchParam2BasicMode("SLOOP_Ts",SLOOP_Ts);
    switchParam2BasicMode("SLOOP_F0",SLoop_bandwidth);
    
    switchParam2BasicMode("SPEED_MAF",2); 
    switchParam2BasicMode("SPEED_IIR_FREQ",30);
    
    switchParam2BasicMode("SLOOP_LIM_HIGH",90);
    switchParam2BasicMode("SLOOP_LIM_LOW",0);
    
    if(testVarValue('FFw_SL','Zero Cancelation'))
      switchParam2BasicMode("SLOOP_Att",0.707);
    else
      switchParam2BasicMode("SLOOP_Att",1);                                                

}

/***************************************************************************//*!
*
* @brief  The function calculates ouput constans based on input parameters   
* @param   
* @return  None
* @remarks 
******************************************************************************/
function clickCalculateSloop()
{
    // need to be global vars due FM update
    SL_LIM_high  = getParentHtmlValue("SLOOP_LIM_HIGH");   
    SL_LIM_low  = getParentHtmlValue("SLOOP_LIM_LOW");
    SPEED_MAF_filt= getParentHtmlValue("SPEED_MAF");
    
    var SLOOP_Ts      = getParentHtmlValue("SLOOP_Ts");
    var SLOOP_F0      = getParentHtmlValue("SLOOP_F0");
    var SLOOP_att     = getParentHtmlValue("SLOOP_Att");       
    var RAMP_Inc      = getParentHtmlValue("RAMP_UP");
    var RAMP_Dec      = getParentHtmlValue("RAMP_DOWN");
    var SPEED_IIR_filt= getParentHtmlValue("SPEED_IIR_FREQ");
    var Imax          = getParentHtmlValue("I_max");
    var Nmax          = getParentHtmlValue("N_max");
    var kt            = getParentHtmlValue("kt");
    var J             = getParentHtmlValue("J");  
    var TLOOP_Ts      = getParentHtmlValue("TLOOP_Ts"); 
    var PP            = getParentHtmlValue("pp");   
    var Tmax          = Imax*kt; 
    var Wmax          = 2*Math.PI*PP*Nmax/60;
    var W_KP_MAN      = getParentHtmlValue("SLOOP_KP_MAN"); 
    var W_KI_MAN      = getParentHtmlValue("SLOOP_KI_MAN");
    var SL_MAN_TUN    = getParentHtmlValue("SLOOP_PI_MAN_EN");
    var IIRxCoefsScaleType     = parent.document.getElementById("IIRxCoefsScale").innerText;
    
    //////////////////////// Related to SPEED LOOP ///////////////////				
		if (SL_MAN_TUN)
    {
       W_Kps = W_KP_MAN;
       W_Kis = W_KI_MAN;
    }
    else
    {
      W_Kps = 2*SLOOP_att*2*Math.PI*SLOOP_F0*J;	
		  W_Kis = (Math.pow((2*Math.PI*SLOOP_F0),2)*J);	
		}
    
    
		W_Kpz = (W_Kps).toFixed(12);	
		W_Kiz = (W_Kis*SLOOP_Ts).toFixed(12);	
    
    W_Kpz_f = W_Kpz*Wmax/Tmax;	
		W_Kiz_f = W_Kiz*Wmax/Tmax;
    
    /* proportional and integral components */
    if(W_Kpz_f>1)
	  	W_Kp_sc = Math.ceil(Math.log(Math.abs(W_Kpz_f))/Math.log(2));
    else
      W_Kp_sc = Math.ceil(Math.log(Math.abs(1/W_Kpz_f))/Math.log(2)-1);
    
		if(W_Kiz_f>1)
			W_Ki_sc = Math.ceil(Math.log(Math.abs(W_Kiz_f))/Math.log(2));
    else
      W_Ki_sc = -Math.ceil(Math.log(Math.abs(1/W_Kiz_f))/Math.log(2)-1);
    
	  W_Kp_g  = (W_Kpz_f/Math.pow(2,W_Kp_sc)).toFixed(12);
    W_Ki_g  = (W_Kiz_f/Math.pow(2,W_Ki_sc)).toFixed(12);
    testFracValRange("W_Kp_g",W_Kp_g);
    testFracValRange("W_Ki_g",W_Ki_g);
    
     ////// RECCURENT PI CONTROLLER TYPE ///////
    // scaling to scale and scale shift components
    W_CC1s = ((W_Kps + W_Kis*SLOOP_Ts/2)).toFixed(12);	
  	W_CC2s = ((-W_Kps + W_Kis*SLOOP_Ts/2)).toFixed(12);
    
    W_CC1f = W_CC1s*Wmax/Tmax;
    W_CC2f = W_CC2s*Wmax/Tmax;
  
    // scale shift
    if ((Math.abs(W_CC1f)<1) && (Math.abs(W_CC2f)<1))  W_Nshift = 0;
    else
    {
      if (Math.abs(W_CC1f) > Math.abs(W_CC2f))
          W_Nshift = Math.ceil(Math.log(Math.abs(W_CC1f))/Math.log(2));
      else
          W_Nshift = Math.ceil(Math.log(Math.abs(W_CC2f))/Math.log(2));        
    }
    
    W_CC1_out = (W_CC1f/Math.pow(2,W_Nshift)).toFixed(12);
    W_CC2_out = (W_CC2f/Math.pow(2,W_Nshift)).toFixed(12);
    testFracValRange("W_CC1_out",W_CC1_out);
    testFracValRange("W_CC2_out",W_CC2_out,1);
        
     
    // speed ramp increments
    rampInc_float = RAMP_Inc*SLOOP_Ts;
    rampInc_float = RAMP_Dec*SLOOP_Ts;
    rampInc =  (RAMP_Inc/60*PP*2*Math.PI/Wmax*SLOOP_Ts).toFixed(12);
    rampDec =  (RAMP_Dec/60*PP*2*Math.PI/Wmax*SLOOP_Ts).toFixed(12);
    testFracValRange("rampInc",rampInc,1);
    testFracValRange("rampInc",rampDec,1);
    
    // PI controller limits scaled
    /*
    Upper_limit = Math.round((SLOOP_lim/Imax)*1000000000000)/1000000000000;
    Lower_limit = Math.round((SLOOP_Low_lim/Imax)*1000000000000)/1000000000000;
    testFracValRange("Upper_limit",Upper_limit,1);
    testFracValRange("Lower_limit",Lower_limit,1);
    */
    // actual speed IIR filter
    W_IIR_B0_fl = ((2*Math.PI*SPEED_IIR_filt*SLOOP_Ts)/(2+(2*Math.PI*SPEED_IIR_filt*SLOOP_Ts))).toFixed(12); 
    W_IIR_B1_fl = ((2*Math.PI*SPEED_IIR_filt*SLOOP_Ts)/(2+(2*Math.PI*SPEED_IIR_filt*SLOOP_Ts))).toFixed(12);
    W_IIR_A1_fl = ((2*Math.PI*SPEED_IIR_filt*SLOOP_Ts-2)/(2+(2*Math.PI*SPEED_IIR_filt*SLOOP_Ts))).toFixed(12);
    W_IIR_B0_out =  W_IIR_B0_fl/IIRxCoefsScaleType;
    W_IIR_B1_out =  W_IIR_B1_fl/IIRxCoefsScaleType;
    W_IIR_A1_out =  W_IIR_A1_fl/IIRxCoefsScaleType;
    testFracValRange("W_IIR_B0_out",W_IIR_B0_out,1);
    testFracValRange("W_IIR_B1_out",W_IIR_B1_out,1);
    testFracValRange("W_IIR_A1_out",W_IIR_A1_out,1);

    // speed counter
    speedCounter =  Math.round(SLOOP_Ts / TLOOP_Ts);
    
    // torque controller limit in percentage of DC_BUS voltage actual
    SL_LIM_high = (SL_LIM_high/100).toFixed(12);
    if(SL_LIM_low!=0)
      SL_LIM_low = (SL_LIM_low/100).toFixed(12);
    
    // If SPEED LOOP tab is active ******************************************
    if(document.getElementById("SLoop") != undefined)
    {
      // write values to forms in current Html page
      setInnerHtmlValue("SL_Kp_g",W_Kps,W_Kpz);
      setInnerHtmlValue("SL_Ki_g",W_Kis,W_Kiz);
      
      // write values to forms in current Html page
      setInnerHtmlValue("SL_CC1",W_CC1s,W_CC1s);
      setInnerHtmlValue("SL_CC2",W_CC2s,W_CC2s);
        
      // Zero cancelation
      setInnerHtmlValue("SL_IIR_B0",W_IIR_B0_fl,W_IIR_B0_fl);
      setInnerHtmlValue("SL_IIR_B1",W_IIR_B1_fl,W_IIR_B1_fl);
      setInnerHtmlValue("SL_IIR_A1",W_IIR_A1_fl,W_IIR_A1_fl);
 
    }
      
     // If HEADER FILE tab is active ********************************************
     if(document.getElementById("HeaderFileTab") != undefined)
     {	
        if(testVarValue('Scontroller','Parallel')) // parallel type of PI controller
        {
          // write values to forms in current Html page
          setInnerHtmlValueAsText("SPEED_KP_GAIN",0,W_Kp_g, W_Kpz);
          setInnerHtmlValueAsText("SPEED_KP_SC",1,W_Kp_sc);
          setInnerHtmlValueAsText("SPEED_KI_GAIN",0,W_Ki_g, W_Kiz);
          setInnerHtmlValueAsText("SPEED_KI_SC",1,W_Ki_sc);
        }
        else // reccurent type of PI controller 
        {
          // write values to forms in current Html page
          setInnerHtmlValueAsText("SPEED_NSHIFT",1,W_Nshift);
          setInnerHtmlValueAsText("SPEED_CC1SC",0,W_CC1f,W_CC1s);
          setInnerHtmlValueAsText("SPEED_CC2SC",0,W_CC2f,W_CC2s);
        }
        
        if(testVarValue('FFw_SL','Incremental Ramp'))
        {
          // ramp increment
          setInnerHtmlValueAsText("SPEED_RAMP_UP",6,rampInc,rampInc);
          setInnerHtmlValueAsText("SPEED_RAMP_DOWN",6,rampDec,rampDec);
        }
              
        // Speed controller limits
        setInnerHtmlValueAsText("SPEED_LOOP_LIM_HIGH",0,SL_LIM_high,SL_LIM_high);
        setInnerHtmlValueAsText("SPEED_LOOP_LIM_LOW",0,SL_LIM_low,SL_LIM_low);
     
        
        // speed counter
        speedCounter =  Math.round(SLOOP_Ts / TLOOP_Ts);
        setInnerHtmlValueAsText("SPEED_LOOP_CNTR",2,speedCounter);
        
/*  removed duet to P. Stazko requrements      
        if(testVarValue('WFilt','MA Filter'))
        {
          //speed MA filter
          setInnerHtmlValueAsText("SPEED_FILTER_MA",2,SPEED_MAF_filt);
        }
        
        if(testVarValue('WFilt','IIR Filter'))
        {
          //speed MA filter
          setInnerHtmlValueAsText("SPEED_IIR_B0",0,W_IIR_B0_out,W_IIR_B0_out);
          setInnerHtmlValueAsText("SPEED_IIR_B1",0,W_IIR_B1_out,W_IIR_B1_out);
          setInnerHtmlValueAsText("SPEED_IIR_A1",0,W_IIR_A1_out,W_IIR_A1_out);
        }
*/         
     }   
 } 
/* ----------- End of PI controller parameters routine -------------- */  

/***************************************************************************//*!
*
* @brief   update variables in FreeMASTER application
* @param   
* @return  None
* @remarks 
******************************************************************************/
function clickUpdateSloopFM(){
    
    xmlDoc=loadXMLDoc("xml_files\\FM_params_list.xml"); 
    
    // calculate actual constant values
    clickCalculateSloop();
    
    if(testVarValue('Scontroller','Parallel')) // parallel type of PI controller
    {
        UpdateFMVariable(xmlDoc,'SL_Kp_g',W_Kp_g, W_Kpz);
        UpdateFMVariable(xmlDoc,'SL_Kp_sc',W_Kp_sc);
        UpdateFMVariable(xmlDoc,'SL_Ki_g',W_Ki_g, W_Kiz);
        UpdateFMVariable(xmlDoc,'SL_Ki_sc',W_Ki_sc);
     }
     else // reccurent type of PI controller
     {
        UpdateFMVariable(xmlDoc,'SL_Nsh',W_Nshift);
        UpdateFMVariable(xmlDoc,'SL_CC1SC',W_CC1f,W_CC1s);
        UpdateFMVariable(xmlDoc,'SL_CC2SC',W_CC2f,W_CC2s);
     }
    /*
    // PI controller limits
    UpdateFMVariable(xmlDoc,'SL_UP_LIM',SLOOP_Up_lim,SLOOP_Up_lim);
    UpdateFMVariable(xmlDoc,'SL_LOW_LIM',SLOOP_Low_lim,SLOOP_Low_lim);
    */
    // speed ramp
    if(testVarValue('FFw_SL','Incremental Ramp'))
    {
        UpdateFMVariable(xmlDoc,'RAMP_UP_g',rampInc,rampInc_float);
        UpdateFMVariable(xmlDoc,'RAMP_DOWN_g',rampDec,rampDec_float);
    }

/*  removed duet to P. Stazko requrements          
    if(testVarValue('WFilt','MA Filter'))
    {
      //speed MA filter
      UpdateFMVariable(xmlDoc,'SPEED_MAF_sc',SPEED_MAF_filt,SPEED_MAF_filt);
    }
    
    if(testVarValue('WFilt','IIR Filter'))
    {
       //speed IIR filter
       UpdateFMVariable(xmlDoc,'SPEED_IIR_B0_g',W_IIR_B0_out);
       UpdateFMVariable(xmlDoc,'SPEED_IIR_B1_g',W_IIR_B1_out);
       UpdateFMVariable(xmlDoc,'SPEED_IIR_A1_g',W_IIR_A1_out);
    }
*/                               
 }

/***************************************************************************//*!
*
* @brief  The function reads values from input forms, scales them and write 
*         to output HTML form
* @param   
* @return 
* @remarks 
******************************************************************************/
function writeSLoopHTMLOutput(prefix,xmlObject)
{
    
    // Speed Loop Control
    document.write(HTML_write_blank_line());     
    document.write(HTML_write_comment_line("Speed Loop Control","",""));
    document.write(HTML_write_comment_line_dash()); 
    document.write(HTML_write_comment_line("Loop bandwidth","SLOOP_F0",""));
    document.write(HTML_write_comment_line("Loop attenuation","SLOOP_Att",""));
    document.write(HTML_write_comment_line("Loop sample time","SLOOP_Ts",""));
    
    if(testVarValue('Scontroller','Parallel'))
    {
      document.write(HTML_write_define_line_number(prefix,0,"SPEED_KP_GAIN",xmlObject));
      document.write(HTML_write_define_line_number(prefix,1,"SPEED_KP_SC",xmlObject));
      document.write(HTML_write_define_line_number(prefix,0,"SPEED_KI_GAIN",xmlObject));
      document.write(HTML_write_define_line_number(prefix,1,"SPEED_KI_SC",xmlObject));
    }
    else
    {
      document.write(HTML_write_define_line_number(prefix,1,"SPEED_NSHIFT",xmlObject));
      document.write(HTML_write_define_line_number(prefix,0,"SPEED_CC1SC",xmlObject));
      document.write(HTML_write_define_line_number(prefix,0,"SPEED_CC2SC",xmlObject));              
    } 
    
    document.write(HTML_write_define_line_number(prefix,0,"SPEED_LOOP_LIM_HIGH",xmlObject));
    document.write(HTML_write_define_line_number(prefix,0,"SPEED_LOOP_LIM_LOW",xmlObject));
    
    
    
    if(testVarValue('FFw_SL','Incremental Ramp'))
    {  
      document.write(HTML_write_blank_line());
      document.write(HTML_write_define_line_number(prefix,0,"SPEED_RAMP_UP",xmlObject));
      document.write(HTML_write_define_line_number(prefix,0,"SPEED_RAMP_DOWN",xmlObject));
    }
    
    //document.write(HTML_write_blank_line());
    //document.write(HTML_write_define_line_number(prefix,0,"SPEED_LOOP_CNTR",xmlObject));
    
    document.write(HTML_write_blank_line());
    /* Actual Speed MA filter */
/*    if(testVarValue('WFilt','MA Filter'))
    {
       document.write(HTML_write_define_line_number(prefix,0,"SPEED_FILTER_MA",xmlObject));
    }   
*/
    // Actual Speed MA filter 
    if(testVarValue('WFilt','IIR Filter'))
    {
       document.write(HTML_write_define_line_number(prefix,0,"SPEED_IIR_B0",xmlObject));
       document.write(HTML_write_define_line_number(prefix,0,"SPEED_IIR_B1",xmlObject));
       document.write(HTML_write_define_line_number(prefix,0,"SPEED_IIR_A1",xmlObject));
    }   
    
    copyParent2HeaderCfgById('SLOOP_F0','SLOOP_F0',' [Hz]',true);
    copyParent2HeaderCfgById('SLOOP_Att','SLOOP_Att',' [-]',true);
    copyParent2HeaderCfgById('SLOOP_Ts','SLOOP_Ts',' [sec]',true);
    clickCalculateSloop();

}    

/***************************************************************************//*!
* @brief  The function reads values from input forms, scales them and write 
*         to output file form
* @param   
* @return 
* @remarks 
******************************************************************************/
function writeSLoopHeaderOutput(str)
{
  
   str = write_blank_lines(str,1);     
   str = write_comment_text(str,'Speed Loop Control','');
   str = write_comment_line_dash(str);
   str = write_comment_text(str,'Loop Bandwidth','SLOOP_F0');    
   str = write_comment_text(str,'Loop Attenuation','SLOOP_ATT');
   str = write_comment_text(str,'Loop sample time','SLOOP_TS');
   str = write_comment_line_dash(str);
 
   //Speed controller
   str = write_comment_text(str,'Speed Controller - Parallel type','','');
   if(testVarValue('Scontroller','Parallel'))
   {
      str = write_define_line_number(str,'SPEED_KP_GAIN'); 
      str = write_define_line_number(str,'SPEED_KP_SC');
      str = write_define_line_number(str,'SPEED_KI_GAIN');
      str = write_define_line_number(str,'SPEED_KI_SC');
    }
    else
    {
      str = write_define_line_number(str,'SPEED_NSHIFT');
      str = write_define_line_number(str,'SPEED_CC1SC');
      str = write_define_line_number(str,'SPEED_CC2SC');
    }
    
    str = write_define_line_number(str,'SPEED_LOOP_LIM_HIGH');
    str = write_define_line_number(str,'SPEED_LOOP_LIM_LOW');
    
    if(testVarValue('FFw_SL','Zero Cancelation'))
    {              
      str = write_blank_lines(str,1);
      str = write_define_line_number(str,'SPEED_ZC_B0');
      str = write_define_line_number(str,'SPEED_ZC_B1');
      str = write_define_line_number(str,'SPEED_ZC_A1');
    }
    if(testVarValue('FFw_SL','Incremental Ramp'))
    {
      str = write_blank_lines(str,1);
      str = write_define_line_number(str,'SPEED_RAMP_UP');
      str = write_define_line_number(str,'SPEED_RAMP_DOWN');
    } 

    //str = write_blank_lines(str,1);
    //str = write_define_line_number(str,'SPEED_LOOP_CNTR');
    str = write_blank_lines(str,1);
    if(testVarValue('WFilt','MA Filter'))
    {
      str = write_define_line_number(str,'SPEED_FILTER_MA');
    }  
    // Actual Speed MA filter 
    if(testVarValue('WFilt','IIR Filter'))
    {
      str = write_define_line_number(str,'SPEED_IIR_B0');
      str = write_define_line_number(str,'SPEED_IIR_B1');
      str = write_define_line_number(str,'SPEED_IIR_A1');
    }
    return str;
}

/***************************************************************************//*!
* @brief  The function reads values from input forms, scales them and write 
*         to output file form
* @param   
* @return 
* @remarks 
******************************************************************************/
function SL_PImanualTuning()
{
  var parameterIdArray=new Array(3);
  parameterIdArray[0] = "SLOOP_Ts";
  parameterIdArray[1] = "SLOOP_F0";
  parameterIdArray[2] = "SLOOP_Att";
  
  //get active motor to select proper prefix
  var prefixM = getActiveMotor();
  
  // enable manunal tuning of SL PI controller constants
  if(document.getElementById(prefixM+'SL_PImanualTuning').checked)
  {
    for(i=0;i<3;i++){
      // set read only attributte
      document.getElementById(prefixM +  parameterIdArray[i]).readOnly  = true;
      // change background color
      document.getElementById(prefixM +  parameterIdArray[i]).style.backgroundColor ='#C3C7CC';   //rgb(195,199,204)
      // clear red text color of ID in main inner table 
      parent.document.getElementById(prefixM +  parameterIdArray[i]).style.color="black";
    }
    
    // swap constant / parametr displaying of PI constants
    document.getElementById('SL_PI_const').style.display = "none";
    document.getElementById('SL_PI_const_param').style.display = "";
    
    // enable Kp and Ki for writting
    document.getElementById('SL_Kp_g').style.backgroundColor ='';
    document.getElementById('SL_Ki_g').style.backgroundColor ='';
    
    // set manual tuning enabling to parameter
    parent.document.getElementById(prefixM + 'SLOOP_PI_MAN_EN').innerHTML = 1;
    
    // preset values for manual constant tuning
    if((getParentHtmlValue('SLOOP_KP_MAN'))==0)
      document.getElementById(prefixM + 'SLOOP_KP_MAN').value = document.getElementById('SL_Kp_g').value;
    else
      copyParent2InnerValById("SLOOP_KP_MAN");
   
    if((getParentHtmlValue('SLOOP_KI_MAN'))==0)
      document.getElementById(prefixM + 'SLOOP_KI_MAN').value = document.getElementById('SL_Ki_g').value;
    else
      copyParent2InnerValById("SLOOP_KI_MAN");
  }
  else
  {
    for(i=0;i<3;i++){
      // set read only attributte
      document.getElementById(prefixM +  parameterIdArray[i]).readOnly  = false;
      // change background color
      document.getElementById(prefixM +  parameterIdArray[i]).style.backgroundColor ='';   //rgb(195,199,204)
      // clear red text color of ID in main inner table 
      parent.document.getElementById(prefixM +  parameterIdArray[i]).style.color="";
    }
    // swap constant / parametr displaying of PI constants
    document.getElementById('SL_PI_const').style.display = "";
    document.getElementById('SL_PI_const_param').style.display = "none";
    
    // enable Kp and Ki for writting
    document.getElementById('SL_Kp_g').style.backgroundColor ='#C3C7CC';
    document.getElementById('SL_Ki_g').style.backgroundColor ='#C3C7CC';
    
    // set manual tuning enablin to parameter
    parent.document.getElementById(prefixM + 'SLOOP_PI_MAN_EN').innerHTML = 0;
    
    // update items
    clickCalculateSloop();
  }  
}

/***************************************************************************//*!
*
* @brief  Unified function updating constants on active tab
* @param   
* @return 
* @remarks 
******************************************************************************/
function updateTab_SLoop()
{
   // update constants
   clickCalculateSloop();
}

/***************************************************************************//*!
* 
******************************************************************************
* End of code
******************************************************************************/
