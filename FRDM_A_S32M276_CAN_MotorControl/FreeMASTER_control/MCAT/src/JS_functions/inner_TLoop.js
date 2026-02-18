/*******************************************************************************
*
* Copyright 2006-2015 Freescale Semiconductor, Inc.
* Copyright 2016-2017 NXP
*
****************************************************************************//*!
*
* @file   inner_TLoop.js
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
* initLoadFormTloop() - init Torque Loop control page paramters and constants  
* clickCalculateTloop() - calculates control constants based on input parameters
* clickUpdateTLoopFM() - update selected variables in FreeMASTER application
* writeTLoopHTMLOutput(prefix,xmlObject) - write selected constants to output preview page 
* writeTLoopHeaderOutput(str,prefix) - write selected constants to output header file
*******************************************************************************/

/***************************************************************************//*!
*
* @brief   The function loads values from inner storage table to forms based
*         on parameter ID
* @param   
* @return 
* @remarks 
******************************************************************************/
function initLoadFormTloop()
{
     var ControllerType = null;
     
      // in basic mode, precalculate paramters
      if(getActiveMode()==0)
        basicModeCalcTLoop();
     
     if(testVarValue('Ccontroller','Parallel'))
     {
       document.getElementById("Tloop_PIparal").style.display = "";
       document.getElementById("Tloop_PIrecur").style.display = "none";   
       ControllerType = 'Parallel';
     }
     else
     {
       document.getElementById("Tloop_PIparal").style.display = "none";
       document.getElementById("Tloop_PIrecur").style.display = "";
       ControllerType = 'Reccurent';    
     }   
     
     copyParent2InnerValById("TLOOP_Ts");      
     copyParent2InnerValById("TLOOP_F0");   
     copyParent2InnerValById("TLOOP_Att");
     copyParent2InnerValById("TLOOP_LIM_HIGH");
     copyParent2InnerValById("TLOOP_LIM_LOW");
     copyParent2InnerValById("TLOOP_MAF");
     
    
     var prefixM = getActiveMotor();
     parent.document.getElementById(prefixM + "Ccontroller").innerText = ControllerType;
        
     // enable button enabling
     ReloadStoreButtonsOnOff(1);
   
     // check manual tuning mode
     //get active motor to select proper prefix
     var prefixM = getActiveMotor();
     if(parent.document.getElementById(prefixM + 'TLOOP_PI_MAN_EN').innerHTML==1)
     {
       copyParent2InnerValById("TLOOP_KP_MAN");
       copyParent2InnerValById("TLOOP_KI_MAN");
       document.getElementById(prefixM+'TL_PImanualTuning').checked=true;
     }
     else
       document.getElementById(prefixM+'TL_PImanualTuning').checked=false;  
    
    
     //calculate constants
     clickCalculateTloop();  
    
     //manual tunning function
     TL_PImanualTuning();
     
}

/***************************************************************************//*!
*
* @brief   Parameter Calculation in BASIC mode
* @param   
* @return  None
* @remarks 
******************************************************************************/
function basicModeCalcTLoop()
{
    var Rs            = getParentHtmlValue("Rs");
    var Ls            = getParentHtmlValue("Ls");
    var Ts            = getParentHtmlValue("TLOOP_Ts");
    var Imax          = getParentHtmlValue("I_max");
    var Umax          = getParentHtmlValue("U_max");
    var Att           = getParentHtmlValue("TLOOP_Att");
    
    // calculated input parameters
    //TLoop_bandwidth = (10*Rs/Lq).toFixed(0);
    TLoop_bandwidth = ((Umax + 2*Rs*Imax)/(4*Att*Ls*Imax*Math.PI*2)).toFixed(0);
    
    
    // replace and disable params
    switchParam2BasicMode("TLOOP_F0",TLoop_bandwidth);
    switchParam2BasicMode("TLOOP_Ts",Ts);
    switchParam2BasicMode("TLOOP_Att",1);
    switchParam2BasicMode("TLOOP_LIM_HIGH",91);
    switchParam2BasicMode("TLOOP_LIM_LOW",0);                                                
}

/***************************************************************************//*!
*
* @brief  The function calculates ouput constans based on input parameters  
* @param   
* @return  None
* @remarks 
******************************************************************************/
function clickCalculateTloop()
{
    var fo          = getParentHtmlValue("TLOOP_F0"); 
    var Att         = getParentHtmlValue("TLOOP_Att");
    var Ts          = getParentHtmlValue("TLOOP_Ts");       
    var Rs          = getParentHtmlValue("Rs");       
    var Ls          = getParentHtmlValue("Ls");       
    var Imax        = getParentHtmlValue("I_max");    
    var Umax        = getParentHtmlValue("U_max");    
    var TL_LIM_high = getParentHtmlValue("TLOOP_LIM_HIGH");
    var TL_LIM_low  = getParentHtmlValue("TLOOP_LIM_LOW");
    var IIRxCoefsScaleType     = parent.document.getElementById("IIRxCoefsScale").innerText;  
    var TL_KP_MAN   = getParentHtmlValue("TLOOP_KP_MAN"); 
    var TL_KI_MAN   = getParentHtmlValue("TLOOP_KI_MAN");
    var TL_MAN_TUN  = getParentHtmlValue("TLOOP_PI_MAN_EN");
    var TL_MAF      =  getParentHtmlValue("TLOOP_MAF");
    
    
    // torque controller limit in percentage of DC_BUS voltage actual
    TL_LIM_high = (TL_LIM_high/100).toFixed(12);
    testFracValRange("TL_LIM_high",TL_LIM_high);
    if(TL_LIM_low!=0)
      TL_LIM_low = (TL_LIM_low/100).toFixed(12);
    
    
    //////////////////////// Related to D axis ///////////////////////////////				
  	if (TL_MAN_TUN)
    {
       TL_Kps = TL_KP_MAN;
       TL_Kis = TL_KI_MAN;
    }
    else
    {
      TL_Kps = 2*Att*2*Math.PI*fo*Ls-Rs;
  	  TL_Kis = Math.pow((2*Math.PI*fo),2)*Ls;
    }  	
  		
  	TL_Kpz = TL_Kps;
    TL_Kiz = TL_Kis*Ts;
    
    ////// PARALLEL PI CONTROLLER TYPE ///////
    TL_Kpz_f = TL_Kpz*Imax/Umax; 
    TL_Kiz_f = TL_Kiz*Imax/Umax;
    
    // scaling to scale and scale shift components
    // proportional             
    if(TL_Kpz_f<1) TL_Kp_shift = -Math.ceil(Math.log(Math.abs(1/TL_Kpz_f))/Math.log(2)-1);
    else          TL_Kp_shift = Math.ceil(Math.log(Math.abs(TL_Kpz_f))/Math.log(2));
    
    TL_Kp_gain = (TL_Kpz_f*Math.pow(2,-TL_Kp_shift)).toFixed(12);
    testFracValRange("TL_Kp_gain",TL_Kp_gain);
    
    // integral
    if(TL_Kiz_f<1) TL_Ki_shift = -Math.ceil(Math.log(Math.abs(1/TL_Kiz_f))/Math.log(2)-1);
    else          TL_Ki_shift = Math.ceil(Math.log(Math.abs(TL_Kiz_f))/Math.log(2));
    
    TL_Ki_gain = (TL_Kiz_f*Math.pow(2,-TL_Ki_shift)).toFixed(12); 
    testFracValRange("TL_Ki_gain",TL_Ki_gain);
    
    ///// ************** RECCURENT PI CONTROLLER TYPE ***************** ///////
    // scaling to scale and scale shift components
    TL_CC1s = ((TL_Kps + TL_Kis*Ts/2)).toFixed(12);	
  	TL_CC2s = ((-TL_Kps + TL_Kis*Ts/2)).toFixed(12);
    	
    // scale constants
    TL_CC1f = TL_CC1s*Imax/Umax;
    TL_CC2f = TL_CC2s*Imax/Umax;
  
    // scale shift
    if ((Math.abs(TL_CC1f)<1) && (Math.abs(TL_CC2f)<1))   TL_Nshift = 0;
    else
    {
      if (Math.abs(TL_CC1f) > Math.abs(TL_CC2f))
          TL_Nshift = Math.ceil(Math.log(Math.abs(TL_CC1f))/Math.log(2));
      else
          TL_Nshift = Math.ceil(Math.log(Math.abs(TL_CC2f))/Math.log(2));        
    }
    
    TL_CC1_out = (TL_CC1f/Math.pow(2,TL_Nshift)).toFixed(12);
    TL_CC2_out = (TL_CC2f/Math.pow(2,TL_Nshift)).toFixed(12);
    testFracValRange("TL_CC1_out",TL_CC1_out);
    testFracValRange("TL_CC2_out",TL_CC2_out,1);
    
       
   // If TORQUE LOOP tab is active ******************************************
    if(document.getElementById("TLoop") != undefined)
    {
      ////// RECCURENT PI CONTROLLER TYPE ///////
      setInnerHtmlValue("TL_CC1",TL_CC1s,TL_CC1s);
      setInnerHtmlValue("TL_CC2",TL_CC2s,TL_CC2s);
      
      ////// PARALLEL PI CONTROLLER TYPE ///////
      setInnerHtmlValue("TL_Kp_g",TL_Kps,TL_Kpz);
      setInnerHtmlValue("TL_Ki_g",TL_Kis,TL_Kiz);        
  
    }      

    // If HEADER FILE tab is active ********************************************
    if(document.getElementById("HeaderFileTab") != undefined)
    {
      setInnerHtmlValueAsText("TL_LIM_HIGH",0,TL_LIM_high, TL_LIM_high);
      setInnerHtmlValueAsText("TL_LIM_LOW",0,TL_LIM_low, TL_LIM_low);
      setInnerHtmlValueAsText("TL_MAF",2,TL_MAF);
      
      if(testVarValue('Ccontroller','Parallel')) // parallel type of PI controller
      {
          ////// PARALLEL PI CONTROLLER TYPE ///////
          setInnerHtmlValueAsText("TL_KP_GAIN",0,TL_Kp_gain,TL_Kpz);
          setInnerHtmlValueAsText("TL_KI_GAIN",0,TL_Ki_gain,TL_Kiz);
          setInnerHtmlValueAsText("TL_KP_SC",1,TL_Kp_shift,'N/A');
          setInnerHtmlValueAsText("TL_KI_SC",1,TL_Ki_shift,'N/A');
       }
        
     }    
} 

/***************************************************************************//*!
*
* @brief   update variables in FreeMASTER application
* @param   
* @return  None
* @remarks 
******************************************************************************/
function clickUpdateTloopFM()
{
    
    xmlDoc=loadXMLDoc("xml_files\\FM_params_list.xml");   
    
    if(testVarValue('Ccontroller','Parallel')) // parallel type of PI controller
    {
        UpdateFMVariable(xmlDoc,'TL_Kp_g',TL_Kp_gain,TL_Kpz);
        UpdateFMVariable(xmlDoc,'TL_Ki_g',TL_Ki_gain,TL_Kiz);
        UpdateFMVariable(xmlDoc,'TL_Kp_sc',TL_Kp_shift);
        UpdateFMVariable(xmlDoc,'TL_Ki_sc',TL_Ki_shift);
     }
     else // reccurent type of PI controller
     {
        UpdateFMVariable(xmlDoc,'TL_NSHIFT',TL_Nshift);
        UpdateFMVariable(xmlDoc,'TL_CC1SC',TL_CC1_out,TL_CC1s);
        UpdateFMVariable(xmlDoc,'TL_CC2SC',TL_CC2_out,TL_CC2s);
 
     }
     
}

/***************************************************************************//*!
*
* @brief  The function reads values from input forms, scales them and write 
*         to output HTML form
* @param   
* @return 
* @remarks 
******************************************************************************/
function writeTLoopHTMLOutput(prefix,xmlObject)
{
      // Current Loop Control
      document.write(HTML_write_blank_line());              
      document.write(HTML_write_comment_line("Torque Loop Control","",""));
      document.write(HTML_write_comment_line_dash());       
      
      document.write(HTML_write_comment_line("Loop bandwidth","TLOOP_F0",""));
      document.write(HTML_write_comment_line("Loop attenuation","TLOOP_Att",""));
      document.write(HTML_write_comment_line("Loop sample time","TLOOP_Ts",""));
      document.write(HTML_write_blank_line());
      document.write(HTML_write_define_line_number(prefix,0,"TL_LIM_HIGH",xmlObject));
      document.write(HTML_write_define_line_number(prefix,0,"TL_LIM_LOW",xmlObject));
      document.write(HTML_write_define_line_number(prefix,0,"TL_MAF",xmlObject));
      
      // Torque PI Controller
      document.write(HTML_write_blank_line()); 
      document.write(HTML_write_comment_line("Torque Loop parameters","",""));
      
      if(testVarValue('Ccontroller','Parallel'))
      {
        document.write(HTML_write_define_line_number(prefix,0,"TL_KP_GAIN",xmlObject));
        document.write(HTML_write_define_line_number(prefix,1,"TL_KP_SC",xmlObject));
        document.write(HTML_write_define_line_number(prefix,0,"TL_KI_GAIN",xmlObject));
        document.write(HTML_write_define_line_number(prefix,1,"TL_KI_SC",xmlObject)); 
      }
      else
      {
        document.write(HTML_write_define_line_number(prefix,1,"TL_NSHIFT",xmlObject));
        document.write(HTML_write_define_line_number(prefix,0,"TL_CC1SC",xmlObject));
        document.write(HTML_write_define_line_number(prefix,0,"TL_CC2SC",xmlObject));
      }
  
      copyParent2HeaderCfgById('TLOOP_F0','TLOOP_F0',' [Hz]',true);
      copyParent2HeaderCfgById('TLOOP_Att','TLOOP_Att',' [-]',true);
      copyParent2HeaderCfgById('TLOOP_Ts','TLOOP_Ts',' [sec]',true);
      clickCalculateTloop();

}
 
/***************************************************************************//*!
*
* @brief  The function reads values from input forms, scales them and write 
*         to output file form
* @param   
* @return 
* @remarks 
******************************************************************************/
function writeTLoopHeaderOutput(str) 
{
     str = write_blank_lines(str,1);     
     str = write_comment_text(str,'Torque Loop Control','');
     str = write_comment_line_dash(str);
     str = write_comment_text(str,'Loop Bandwidth','TLOOP_F0');    
     str = write_comment_text(str,'Loop Attenuation','TLOOP_ATT');
     str = write_comment_text(str,'Loop sample time','TLOOP_TS');
     str = write_comment_line_dash(str);
   
     str = write_comment_text(str,'Torque Controller Output Limit ','','');
     str = write_define_line_number(str,'TL_LIM_HIGH');
     str = write_define_line_number(str,'TL_LIM_LOW');
     str = write_define_line_number(str,'TL_MAF');
      
     //D-axis controller
     str = write_comment_text(str,'Torque Controller - Parallel type','','');
     if(testVarValue('Ccontroller','Parallel'))
     {
        str = write_define_line_number(str,'TL_KP_GAIN'); 
        str = write_define_line_number(str,'TL_KP_SC');
        str = write_define_line_number(str,'TL_KI_GAIN');
        str = write_define_line_number(str,'TL_KI_SC');
      }
      else
      {
        str = write_define_line_number(str,'TL_NSHIFT');
        str = write_define_line_number(str,'TL_CC1SC');
        str = write_define_line_number(str,'TL_CC2SC');
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
function TL_PImanualTuning()
{
  var parameterIdArray=new Array(3);
  parameterIdArray[0] = "TLOOP_Ts";
  parameterIdArray[1] = "TLOOP_F0";
  parameterIdArray[2] = "TLOOP_Att";
  
  //get active motor to select proper prefix
  var prefixM = getActiveMotor();
  
  // enable manunal tuning of TL PI controller constants
  if(document.getElementById(prefixM+'TL_PImanualTuning').checked)
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
    document.getElementById('TL_PI_const').style.display = "none";
    document.getElementById('TL_PI_const_param').style.display = "";
    
    // enable Kp and Ki for writting
    document.getElementById('TL_Kp_g').style.backgroundColor ='';
    document.getElementById('TL_Ki_g').style.backgroundColor ='';
    
    // set manual tuning enabling to parameter
    parent.document.getElementById(prefixM + 'TLOOP_PI_MAN_EN').innerHTML = 1;
    
    // preset values for manual constant tuning
    if((getParentHtmlValue('TLOOP_KP_MAN'))==0)
      document.getElementById(prefixM + 'TLOOP_KP_MAN').value = document.getElementById('TL_Kp_g').value;
    else
      copyParent2InnerValById("TLOOP_KP_MAN");
   
    if((getParentHtmlValue('TLOOP_KI_MAN'))==0)
      document.getElementById(prefixM + 'TLOOP_KI_MAN').value = document.getElementById('TL_Ki_g').value;
    else
      copyParent2InnerValById("TLOOP_KI_MAN");
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
    document.getElementById('TL_PI_const').style.display = "";
    document.getElementById('TL_PI_const_param').style.display = "none";
    
    // enable Kp and Ki for writting
    document.getElementById('TL_Kp_g').style.backgroundColor ='#C3C7CC';
    document.getElementById('TL_Ki_g').style.backgroundColor ='#C3C7CC';
    
    // set manual tuning enablin to parameter
    parent.document.getElementById(prefixM + 'TLOOP_PI_MAN_EN').innerHTML = 0;
    
    // update items
    clickCalculateTloop();
  }  
}

/***************************************************************************//*!
*
* @brief  Unified function updating constants on active tab
* @param   
* @return 
* @remarks 
******************************************************************************/
function updateTab_TLoop()
{
   // update constants
   clickCalculateTloop();
}
/***************************************************************************//*!
* 
******************************************************************************
* End of code
******************************************************************************/
