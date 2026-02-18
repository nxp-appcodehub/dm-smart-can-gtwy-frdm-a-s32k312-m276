/*******************************************************************************
*
* Copyright 2006-2015 Freescale Semiconductor, Inc.
* Copyright 2016-2017 NXP
*
****************************************************************************//*!
*
* @file   inner_Cascade.js
*
* @brief  javascrip engine for MCAT
*
* @version 1.0.1.0
* 
* @date May-6-2014
* 
******************************************************************************/
/******************************************************************************
* List of functions
******************************************************************************
* initLoadFormCascade() - init Cascade page paramters and constants  
* clickUpdateCtrlStruc() - calculates control constants based on input parameters
* writeCascadeHTMLOutput(prefix,xmlObject) - write selected constants to output preview page 
* writeCascadeHeaderOutput(str) - write selected constants to output header file
*******************************************************************************/

/***************************************************************************//*!
* @brief   The function check XML field ti not empty and try to read FM variable
* @param    
* @return  
* @remarks 
*******************************************************************************/   
function checkXMLvar()
{
  var tempXMLVar;
  // names of XML field used in CtrlScructure
  var xmlElements = new Array ('ControlStructureMethod', 
                               'onoff',
                               'Uboost',
                               'Freq_req',
                               'U_req',
                               'I_max',
                               'Speed_req');

  var errorFMread = '';
  var errorXMLfield = '';
  
  var MotorPrefix = getActiveMotor();                               
  var xmlDoc=loadXMLDoc("xml_files\\FM_params_list.xml");   
  
    // check defined XML fields 
   for(var j=0;j<xmlElements.length;j++){
    
    tempXMLVar = xmlDoc.getElementsByTagName(MotorPrefix+ xmlElements[j])[0];
    
   if(tempXMLVar.childNodes.length!=0)
   {
     if(!(pcm.ReadVariable(tempXMLVar.childNodes[0].nodeValue)))
        errorFMread = errorFMread + '\n "' + tempXMLVar.childNodes[0].nodeValue + '"';
   }     
   else // XML field empty
     errorXMLfield = errorXMLfield + '\n"' +MotorPrefix+ xmlElements[j] + '" ';
   }

   if(errorXMLfield!='')
     alert('Error: Empty XML field: '+ errorXMLfield); 
     
   if(errorFMread!='')
     alert('Read error of FM variables: '+ errorFMread);  
   
   if((errorXMLfield!='')||(errorFMread!=''))
    return (false);
   else
    return (true);   
}
/***************************************************************************//*!
*
* @brief   The function creates code of for output constant
* @param   
* @return  None
* @remarks 
******************************************************************************/ 
var Timer_object;

// init load
function initLoadFormCascade()
{
  // basic mode, disable some inputs
      // in basic mode, precalculate paramters
    if(getActiveMode()==0)
    {
       disableInputParamBox('scalar_ctrl_Input1'); 
       disableInputParamBox('volt_ctrl_Input1');
       disableInputParamBox('torque_ctrl_Input1');
       
    }
  
  // check all XML variables and proper FM communication
  if(checkXMLvar())
  {  
    Frm2TwStateReload();
    Frm2TwValuesReload();
    timeUpdate();
  }

  sensorTypeSelectInit();
}   
/***************************************************************************//*!
*
* @brief   Periodically call function
* @param   
* @return  None
* @remarks 
******************************************************************************/ 

// refresh event every 250ms
function timeUpdate()
{
   Timer_object = setInterval(function(){updateButtons()}, 250);
}

/***************************************************************************//*!
*
* @brief   Update Ctrl Structure button states
* @param   
* @return  None
* @remarks 
******************************************************************************/ 
// periodical updates of buttons/switches in Cascade Tab 
function updateButtons()
{
  Frm2TwStateReload();
  StateMachine();
}    

/***************************************************************************//*!
*
* @brief   Sensor type selector init routine - according to parent doc. table
* @param   
* @return  None
* @remarks 
******************************************************************************/     
/* -------------  --------------------------*/
function sensorTypeSelectInit(){
 var optionObject;
 var selectedSensor;
 var j = 0;
  
  
   var MotorPrefix = getActiveMotor();
   // read from main page table
   selectedSensor =  parent.document.getElementById([MotorPrefix]+'pospeFbck').innerHTML;
   // read object by ID from CtrlStructurePage
   optionObject = document.getElementById("pospe_ctrl_Select");
 
   for(var i=0;i<5;i++)
   {
     if (((selectedSensor>>>[i])&1) != 1)    optionObject.remove(j);
     else                                    j++;
   }
}
 
/***************************************************************************//*!
* @brief   The function converts the Number to String form, according to selected control method
* @param   inPointer - number representating the selected ctrl method 
* @return  string of selected control method
* @remarks 
*******************************************************************************/   
function conversionNo2Ctrl(inPointer)
{
    var arithmeticArray=new Array(4);
    arithmeticArray[0] = "scalar_ctrl";
    arithmeticArray[1] = "volt_ctrl";
    arithmeticArray[2] = "torque_ctrl";
    arithmeticArray[3] = "speed_ctrl";    

    return arithmeticArray[inPointer];     
} 

/***************************************************************************//*!
* @brief   The function converts the Number to String form, according to selected reference signals
* @param   inPointer - number representating the selected ctrl method 
* @return  string of selected reference signals
* @remarks 
*******************************************************************************/
function conversionXml2Variables(inPointer)
{
    var referencesArray=new Array(8);
    referencesArray[0] = "Uboost";
    referencesArray[1] = "Freq_req";
    referencesArray[2] = "U_req";
    referencesArray[3] = "I_max";    
    referencesArray[4] = "Speed_req";
    
    return referencesArray[inPointer];     
}
/***************************************************************************//*!
*
* @brief   Reload of the switches/selectors states from FRM to TW
* @param   
* @return  None
* @remarks 
******************************************************************************/     
/* ---------------- Cascade control structure selector ------------------ */  
function Frm2TwStateReload(){
  var retMsg;
  var object = new Array(6); 
  
  var xmlDoc=loadXMLDoc("xml_files\\FM_params_list.xml");   
  var prefixM = getActiveMotor();  
  var CtrlRegisterVal  = xmlDoc.getElementsByTagName([prefixM]+"ControlStructureMethod")[0];
  var PospeRegisterVal = xmlDoc.getElementsByTagName([prefixM]+"ControlStructurePoSpe")[0];
  var on_off           = xmlDoc.getElementsByTagName([prefixM]+"onoff")[0];

  object[1] = document.getElementById('scalar_ctrl');
  object[2] = document.getElementById('volt_ctrl');
  object[3] = document.getElementById('torque_ctrl');      
  object[4] = document.getElementById('speed_ctrl');
  object[5] = document.getElementById('pospe_ctrl'); 
  
  // switching off all switches EN/DIS on the Application Control Structure page
  for(var i=0;i<5;i++)
  {
    object[i+1].className    = "switch_off";
    object[i+1].style.color  = "gray";
    object[i+1].innerHTML    = "DISABLED"; 
  }
  
  //  parsing selected MethodCtrl and set the EN/DIS switches and Id current popup menu
  if(pcm.ReadVariable(CtrlRegisterVal.childNodes[0].nodeValue));
  {
     var in_ctrlRegister = pcm.LastVariable_vValue;
     // separate the method for Id current control
     var in_IdMethodRegister = in_ctrlRegister - 3;
     // separate the method for cascade control structure selection
     if (in_ctrlRegister>3) in_ctrlRegister = 3;
     
     for(var i=0;i<4;i++){
        if(i==in_ctrlRegister)  // i = selected method
        {
          // The button of selected method is ON - Enabled - white colored
          object[i+1].className    = "switch_on";
          object[i+1].style.color  = "white";
          object[i+1].innerHTML    = "ENABLED";
          
          // input text box of selected method is enabled 
          if(i==3)             var boxNumber = 2;
          else                 var boxNumber = 3;  
          for(var j=1;j<boxNumber;j++){
            var Ctrl_type = conversionNo2Ctrl(i);                     
            document.getElementById([Ctrl_type]+'_Input'+[j]).disabled = false;}   
          
          //  Sensor type selector is enabled for all methods ecxept Scalar control, Button is On
          if (i>0){
            object[5].className    = "switch_on";
            object[5].style.color  = "white";
            object[5].innerHTML    = "ENABLED";
            document.getElementById('pospe_ctrl_Select').disabled = false;}
          else
            document.getElementById('pospe_ctrl_Select').disabled = true;
        }
        else                      // unseledted methods - input text box are disabled
        {
          // disabled unused text boxes within an Application Control structure tab
          if(i==3)             var boxNumber = 2;
          else                 var boxNumber = 3;  
            for(var j=1;j<boxNumber;j++){
              var Ctrl_type = conversionNo2Ctrl(i);
              document.getElementById([Ctrl_type]+'_Input'+[j]).disabled = true;}
        } 
      }
     
  }
  
  //  parsing selected PospeFbck and set the sensor type popup menu  
  if(pcm.ReadVariable(PospeRegisterVal.childNodes[0].nodeValue));
  {
     var in_pospeRegister = pcm.LastVariable_vValue;    
     var object_Pospe_control = document.getElementById('pospe_ctrl_Select');
     object_Pospe_control.selectedIndex = in_pospeRegister;
   }  


  // Application On/Off state checking and updating 
  var onoff_object = document.getElementById('sw_app_onoff');
        
  if(pcm.ReadVariable(on_off.childNodes[0].nodeValue));
  {
			var onoffvar = pcm.LastVariable_vValue;
			if(onoffvar == 0)
			{
			  onoffvar = 1;
        onoff_object.className    = "appOff";            
      }
      else
      {
        onoffvar = 0;
        onoff_object.className    = "appOn"; 
      }
		}
}

/***************************************************************************//*!
*
* @brief   Reload of the values from FRM to TW text boxex
* @param   
* @return  None
* @remarks 
******************************************************************************/     
/* ---------------- Cascade control structure variables update ------------------ */  
function Frm2TwValuesReload(){
  var retMsg;
  
  var xmlDoc           = loadXMLDoc("xml_files\\FM_params_list.xml");   
  var prefixM          = getActiveMotor();  
  var CtrlRegisterVal  = xmlDoc.getElementsByTagName([prefixM]+"ControlStructureMethod")[0];

  //  parsing selected MethodCtrl and set the EN/DIS switches and Id current popup menu
  if(pcm.ReadVariable(CtrlRegisterVal.childNodes[0].nodeValue));
  {
     var in_ctrlRegister = pcm.LastVariable_vValue;
     // separate the method for Id current control
     var in_IdMethodRegister = in_ctrlRegister - 3;
     // separate the method for cascade control structure selection
     if (in_ctrlRegister>3) in_ctrlRegister = 3;
     
     for(var i=0;i<4;i++){
        if(i==in_ctrlRegister)  // i = selected method
        {
          var Ctrl_type = conversionNo2Ctrl(i);
          var Val1_type = conversionXml2Variables(i*2); 
          var Val2_type = conversionXml2Variables(i*2+1);
 
          reference_val1 = xmlDoc.getElementsByTagName([prefixM]+[Val1_type])[0];
          reference_val2 = xmlDoc.getElementsByTagName([prefixM]+[Val2_type])[0];

          if(pcm.ReadVariable(reference_val1.childNodes[0].nodeValue))
                document.getElementById([Ctrl_type]+'_Input1').value = Math.ceil(pcm.LastVariable_vValue*10)/10;  
         if(i!=3)
           if(pcm.ReadVariable(reference_val2.childNodes[0].nodeValue))
                document.getElementById([Ctrl_type]+'_Input2').value = Math.ceil(pcm.LastVariable_vValue*10)/10;  
        }
        else                    // unseledted methods - input text box are kept at 0
        {
          var Ctrl_type = conversionNo2Ctrl(i);
          document.getElementById([Ctrl_type]+'_Input1').value = 0;
          if(i!=3)
            document.getElementById([Ctrl_type]+'_Input2').value = 0;

        } 
      } // end of for*/
  } // end of if 
}


/***************************************************************************//*!
*
* @brief   The function stop count timer interval - Stop refreshing the cascade page
* @param   
* @return  None
* @remarks: Stopped refreshing is needed when the user wants to change any control method
*           by selector (Id control, sensor type) 
******************************************************************************/ 
function stopCountInterval()
{
    clearInterval(Timer_object);
}

/***************************************************************************//*!
*
* @brief   Change of the cascade control structure method - according to click
* @param   optionNo - number of selected method
* @return  None
* @remarks 
******************************************************************************/ 
function sensorTypeChange(optionNo)
{
    var retMsg;                                                                               
    var xmlDoc=loadXMLDoc("xml_files\\FM_params_list.xml"); 
    var prefixM = getActiveMotor();  
    var PospeRegisterVal = xmlDoc.getElementsByTagName([prefixM]+"ControlStructurePoSpe")[0];

    succ = pcm.WriteVariable(PospeRegisterVal.childNodes[0].nodeValue, Number(optionNo), retMsg);    
}

/***************************************************************************//*!
*
* @brief   Change of the Id control method - according to selector
* @param   optionNo - number of selected method
* @return  None
* @remarks 
******************************************************************************/ 
function IdMethodChange(optionNo)
{
    var retMsg;
    var xmlDoc=loadXMLDoc("xml_files\\FM_params_list.xml");  
    var prefixM = getActiveMotor();  
    var CtrlRegisterVal = xmlDoc.getElementsByTagName([prefixM]+"ControlStructureMethod")[0];
    
    succ = pcm.WriteVariable(CtrlRegisterVal.childNodes[0].nodeValue, Number(optionNo)+3, retMsg);
}

/***************************************************************************//*!
*
* @brief   Cascade control structure selector
* @param   varID - ID of selected control structure
* @return  None
* @remarks 
******************************************************************************/ 
function Ctrl_Structure_click(varID){
    var retMsg;

    var ctrlRegister  = null;
    
    var xmlDoc=loadXMLDoc("xml_files\\FM_params_list.xml");
    var prefixM = getActiveMotor();      
    var CtrlRegisterVal  = xmlDoc.getElementsByTagName([prefixM]+"ControlStructureMethod")[0];
    var on_off           = xmlDoc.getElementsByTagName([prefixM]+"onoff")[0];
        
    document.getElementById('scalar_ctrl_Input1').value = 0;
    document.getElementById('scalar_ctrl_Input2').value = 0;
    document.getElementById('volt_ctrl_Input1').value = 0;
    document.getElementById('torque_ctrl_Input1').value = 0;
    document.getElementById('speed_ctrl_Input1').value = 0;
                 
    // chceck the state of ON/OFF switch    
    if(pcm.ReadVariable(on_off.childNodes[0].nodeValue));
    {
			var onoffvar = pcm.LastVariable_vValue;
      
      // If ON state is active, it does not allow to change the control structure
			if(onoffvar == 1)
			{
        alert("The control structure cannot be changed during the RUN state!"+ '\n' + "Switch off the application.");        
      }
      else // If OFF state is active, the change of the control structure is allowed
      {
              
        // allow text boxes related to selected control method in Application Control structure tab      
        if(varID==('speed_ctrl')) var boxNumber = 2;
        else                      var boxNumber = 3;  
        for(var j=1;j<boxNumber;j++){
           document.getElementById([varID]+'_Input'+[j]).disabled = false;}   
        
        // generate ctrlRegister value that will be send to FRM (enum type)   
        if(pcm.ReadVariable(CtrlRegisterVal.childNodes[0].nodeValue));
        {
         var in_ctrlRegister = pcm.LastVariable_vValue;
                
         if (varID == 'scalar_ctrl')    {ctrlRegister = 0;
                                         document.getElementById('pospe_ctrl_Select').selectedIndex = -1;
                                         document.getElementById('pospe_ctrl_Select').disabled = true;
                                         document.getElementById('scalar_ctrl_Input1').value = 0;
                                         document.getElementById('scalar_ctrl_Input2').value = 0;}                              
                                         
         if (varID == 'volt_ctrl')      {ctrlRegister = 1;
                                         document.getElementById('volt_ctrl_Input1').value = 0;}                              

         if (varID == 'torque_ctrl')   {ctrlRegister = 2;
                                         document.getElementById('torque_ctrl_Input1').value = 0;}           

         if (varID == 'speed_ctrl')     {ctrlRegister = 3;
                                        document.getElementById('speed_ctrl_Select').disabled = false
                                        }    
          
         // write to FRM   
         succ = pcm.WriteVariable(CtrlRegisterVal.childNodes[0].nodeValue, ctrlRegister, retMsg);
         }
       }
		}

}

/***************************************************************************//*!
*
* @brief   On-Off toggle button routine
* @param   None
* @return  None
* @remarks 
******************************************************************************/    
function Power_click(){
  var retMsg;
  var onoffvar; 
  
  var prefixM = getActiveMotor();
     
  xmlDoc=loadXMLDoc("xml_files\\FM_params_list.xml");
  var on_off=xmlDoc.getElementsByTagName([prefixM]+"onoff");
  
  var object = document.getElementById('sw_app_onoff');
  if(pcm.ReadVariable(on_off[0].childNodes[0].nodeValue))
		{
			var onoffvar = pcm.LastVariable_vValue;
			if(onoffvar == 0)
			{
			  onoffvar = 1;
        object.className    = "appOn";            
      }
      else
      {
        onoffvar = 0;
        object.className    = "appOff"; 
      }
		}
		
		succ = pcm.WriteVariable(on_off[0].childNodes[0].nodeValue, onoffvar, retMsg);
}      

/***************************************************************************//*!
*
* @brief   State machine engine
* @param   None
* @return  None
* @remarks 
******************************************************************************/ 
function StateMachine(){
      var ValueState;
      
      xmlDoc=loadXMLDoc("xml_files\\FM_params_list.xml");
      
      var prefixM = getActiveMotor();
      var ActualState=xmlDoc.getElementsByTagName([prefixM]+"states")[0].getAttribute("FreemasterName");
            
      if(pcm.ReadVariable(ActualState))
      {
        xmlDoc=loadXMLDoc("xml_files\\FM_params_list.xml");
        var states=xmlDoc.getElementsByTagName([prefixM]+"state"); 
        ValueState = pcm.LastVariable_vValue;
  
        var x=document.getElementById('textApplicationState').rows;
        var y=x[0].cells;
        y[0].align="center";
        y[0].innerHTML =  states[ValueState].childNodes[0].nodeValue;  
        y[0].className = "stateTableCell";
        
        if(ValueState == 1)
        {  
          document.getElementById('textApplicationState').style.background = "#FF9999";
        }      
        else
        {
          document.getElementById('textApplicationState').style.background = "transparent";  
        }    
      }
}
     
/***************************************************************************//*!
*
* @brief   chose the image according to selected method
* @param   None
* @return  None
* @remarks               document.getElementById('scalar_ctrl_Input1').value
******************************************************************************/ 
function clickCntStrImage(varID){
    if (varID == scalar_ctrl)   setImageDimensions('images/SCcontrol.png',520,300);  
    if (varID == volt_ctrl)     setImageDimensions('images/Vcontrol.png',430,295);
    if (varID == torque_ctrl)  setImageDimensions('images/Ccontrol.png',590,400);
    if (varID == speed_ctrl)    setImageDimensions('images/Wcontrol.png',765,400); 
}  

/***************************************************************************//*!
*
* @brief   Sets the size of iframe window according to displayed image
* @param   None
* @return  None
* @remarks 
******************************************************************************/ 
function setImageDimensions(imPath, inW, inH){

      var object  = document.getElementById('cntrStrucFrameImage');
      var object2 = document.getElementById('cntrStrucFrameButton');
      
      object.src            = imPath;
      
      object.style.width    = inW;
      object.style.height   = inH;   
    
      object.style.top      = 40;
      object.style.left     = (800-inW)/2;
      
      object2.style.width   = 120;
      object2.style.height  = 25;  
            
      object2.style.top     = 40 + inH - 30;
      object2.style.left    = (800-120)/2;;
      
    object.style.visibility = "";
    object2.style.visibility = "";

    object2.src = 'form_buttonCloseWindow.html';      
}   

/***************************************************************************//*!
*
* @brief   Onclic button event - Update FRM values
* @param   None
* @return  None
* @remarks 
******************************************************************************/
function clickUpdateCtrlStruc(){
    var retMsg;
    var prefixM   = getActiveMotor();
    var writeFRM  = new Array();
    var writeFRMoffset = 0;

    xmlDoc=loadXMLDoc("xml_files\\FM_params_list.xml");
    var MethodCtrlVal = xmlDoc.getElementsByTagName([prefixM]+"ControlStructureMethod")[0];
    
    if(pcm.ReadVariable(MethodCtrlVal.childNodes[0].nodeValue))
      {
        var in_MethodCtrlVal = pcm.LastVariable_vValue;

        if (in_MethodCtrlVal == 0){
         //calculace V/Hz profile
         clickCalculateCascade();
         UpdateFMVariable(xmlDoc,'VHz_const');
          
         writeFRM[0] = document.getElementById('scalar_ctrl_Input1').value;
         writeFRM[1] = document.getElementById('scalar_ctrl_Input2').value;
         
         var writeFRMregisterVal0 = xmlDoc.getElementsByTagName([prefixM]+"Uboost");
         var writeFRMregisterVal1 = xmlDoc.getElementsByTagName([prefixM]+"Freq_req");
        
          // update ramp increment in FM
         UpdateFMVariable(xmlDoc,'VHz_ramp_inc'); 
        }
        
        if (in_MethodCtrlVal == 1){
         writeFRM[0] = document.getElementById('volt_ctrl_Input1').value;
         var writeFRMregisterVal0 = xmlDoc.getElementsByTagName([prefixM]+"U_req");
                  
        }
        
        if (in_MethodCtrlVal == 2){
         writeFRM[0] = document.getElementById('torque_ctrl_Input1').value;
         
         var writeFRMregisterVal0 = xmlDoc.getElementsByTagName([prefixM]+"I_max");
        }
        
        if (in_MethodCtrlVal == 3){
         writeFRM[0] = document.getElementById('speed_ctrl_Input1').value;
         
         var writeFRMregisterVal0 = xmlDoc.getElementsByTagName([prefixM]+"Speed_req");
        }
        
        if (in_MethodCtrlVal > 3){
         writeFRM[0] = document.getElementById('speed_ctrl_Input1').value;
         
         var writeFRMregisterVal0 = xmlDoc.getElementsByTagName([prefixM]+"Speed_req");
        }
        
        if (in_MethodCtrlVal<3){
          succ = pcm.WriteVariable(writeFRMregisterVal0[0].childNodes[0].nodeValue, Number(writeFRM[0]), retMsg); 
          succ = pcm.WriteVariable(writeFRMregisterVal1[0].childNodes[0].nodeValue, Number(writeFRM[1]), retMsg);
          }
        else
          succ = pcm.WriteVariable(writeFRMregisterVal0[0].childNodes[0].nodeValue, Number(writeFRM[0]), retMsg);
      }  
}

/***************************************************************************//*!
*
* @brief  The function calculates ouput constans based on input parameters   
* @param   
* @return  None
* @remarks 
******************************************************************************/
function clickCalculateCascade()
{
    var dTs         = getParentHtmlValue("CLOOP_Ts");
    var SLOOP_Ts    = getParentHtmlValue("SLOOP_Ts");
    var Nmax        = getParentHtmlValue("N_max");
    var PP          = getParentHtmlValue("pp");   
    var Wmax        = 2*Math.PI*PP*Nmax/60;
    var Fmax        = Wmax / (2*Math.PI);
    var Iph         = getParentHtmlValue("I_ph");
    var Uph         = getParentHtmlValue("U_ph");
    var Rs          = getParentHtmlValue("Rs");
    var Umax        = getParentHtmlValue("U_max");        
    var RampInc     = getParentHtmlValue("RAMP_UP"); 
    var N_req_max   = getParentHtmlValue("N_req");
    var SLOOP_Up_lim  = getParentHtmlValue("SL_HIGH_LIM");   
    var Wmax          = 2*Math.PI*PP*Nmax/60;
    
    // U/f Frequency scale
    Fscale = (2*dTs*Fmax).toFixed(12);
    
    U_boost = (Uph*0.1);
    U_boost_f = (U_boost/Umax).toFixed(12);
    testFracValRange("U_boost_f",U_boost_f);
    
    VHz_const = Uph/N_req_max;
    VHz_const_f = (VHz_const*Nmax/Umax).toFixed(12);
    testFracValRange("VHz_const_f",VHz_const_f);
    
    V_Hz_scale = Uph/N_req_max ;
    Speed_ramp_count = N_req_max*SLOOP_Ts / RampInc;
    testFracValRange("VHz_const_f",VHz_const_f);
    
    // scalar control speed ramp increment, ramp running in CLOOP_Ts loop
    // speed ramp increments
    //scalarRampInc =  Math.round(RampInc/60*PP*2*Math.PI/Wmax*dTs*1000000000000)/1000000000000;
    scalarRampInc =  (RampInc/Nmax*dTs).toFixed(12);
    testFracValRange("scalarRampInc",scalarRampInc);
    
    // If CASCADE tab is active ******************************************
    if(document.getElementById("CascadeModule") != undefined)
    {
        // VHz profile constants
        setInnerHtmlValue("VHz_const",VHz_const_f,VHz_const_f);
        setInnerHtmlValue("VHz_ramp_inc",scalarRampInc,scalarRampInc);
        if(getActiveMode()==1)
           setInnerHtmlValue("VHz_Uboost",U_boost,U_boost); 
    
   	}
   
    // If HEADER FILE tab is active ********************************************
    if(document.getElementById("HeaderFileTab") != undefined)
    {	
        setInnerHtmlValueAsText("SCALAR_INTEG_GAIN",3,Fscale,Fscale);
        setInnerHtmlValueAsText("SCALAR_VHZ_CONST",0,VHz_const_f,VHz_const);
        setInnerHtmlValueAsText("SCALAR_VHZ_U_BOOST",0,U_boost_f,U_boost);
        setInnerHtmlValueAsText("SCALAR_RAMP_INC",0,scalarRampInc,scalarRampInc);
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
function writeCascadeHTMLOutput(prefix,xmlObject)
{ 
  // Position & Speed module
    document.write(HTML_write_blank_line());     
    document.write(HTML_write_comment_line("Cascade Control Structure Module","",""));
    document.write(HTML_write_comment_line_dash()); 
    
    document.write(HTML_write_define_line_number(prefix,0,"SCALAR_INTEG_GAIN",xmlObject));
    document.write(HTML_write_define_line_number(prefix,0,"SCALAR_VHZ_CONST",xmlObject));
    document.write(HTML_write_define_line_number(prefix,0,"SCALAR_VHZ_U_BOOST",xmlObject));                            
    document.write(HTML_write_define_line_number(prefix,0,"SCALAR_RAMP_INC",xmlObject));
    clickCalculateCascade();
}

/***************************************************************************//*!
* @brief  The function reads values from input forms, scales them and write 
*         to output file form
* @param   
* @return 
* @remarks 
******************************************************************************/
function writeCascadeHeaderOutput(str)
{
  
   str = write_blank_lines(str,1);     
   str = write_comment_text(str,'Cascade Control Sctucture Module','');
   str = write_comment_line_dash(str);
 
   // Cascade module
    str = write_define_line_number(str,'SCALAR_INTEG_GAIN');
    str = write_define_line_number(str,'SCALAR_VHZ_CONST');
    str = write_define_line_number(str,'SCALAR_VHZ_U_BOOST');
    str = write_define_line_number(str,'SCALAR_RAMP_INC');
        
    return str;
}

/***************************************************************************//*!
* 
******************************************************************************
* End of code
******************************************************************************/
    