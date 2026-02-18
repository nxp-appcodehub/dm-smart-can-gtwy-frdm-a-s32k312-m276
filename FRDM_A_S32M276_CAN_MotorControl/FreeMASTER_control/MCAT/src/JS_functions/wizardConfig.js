/*******************************************************************************
*
* Copyright 2006-2015 Freescale Semiconductor, Inc.
* Copyright 2016-2017 NXP
*
****************************************************************************//*!
*
* @file   wizardConfig.js
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
* innnerHTMLonLoad() - initializes inner HTML page onLoad event
* selectMotor(motorNumber)  - select new active motor according to motorNumber
* getActiveMotor() - return active motor
* marChangedInput(varID) - change color of modified input form
* checkChangedVars(param) - find all inputs with change background color
* setActivePage() - set new active HTML module page
* build_multi_motor_selector (...) - creates multiply motor switch on the main page
* build_parameter_line(....) - add HTML code of new parameter input
* build_divider_line(title) - add a seperation line with optional title
* build_constant_line(...)  - add HTML code of new constant input
* build_control_structure_line(...) - add HTML code of new control line  in CtrlStructurePage.html
* checkIt(evt,id) - check input characters put into Inputs
* calc_WE_max(state) - call or close Form of speed calcultor
* calc_ke(state) - call or close Form of BEMF constant calculator
* 
*
*******************************************************************************/

var tabHTMLFiles = [
        "", // Introduction
        "inner_Parameters.html", // Parameters
        "inner_CtrlLoop.html", // Control Loop
        "inner_SLoop.html",  // Speed Loop
        "inner_PoSpe.html", // Sensorless
        "inner_Sensorless.html", // Sensorless
        "inner_CtrlStructure.html",  // Cascade
        "inner_OutputHeader.html",   // Output File
        ""    // App Control
      ];
/***************************************************************************//*!
*
* @brief   The function initializes inner HTML page onLoad event
* @param   
* @return  None
* @remarks 
******************************************************************************/
function innerHTMLonload()
{
    var motorSelected = getActiveMotor();
    var checkBoxModeObj = document.getElementById("checkBoxMode");
  
}

/***************************************************************************//*!
*
* @brief   The function selects active motor
* @param   motorNumber - active motor number
* @return  None
* @remarks 
******************************************************************************/
function selectMotor(motorNumber)
{
  var activePage  = document.getElementById('mainFrame');
  
  var radioMotor1Obj = document.getElementById("radioMotor1");
  var radioMotor2Obj = document.getElementById("radioMotor2");
  var radioMotor3Obj = document.getElementById("radioMotor3");
  
  var tabMotor1Obj = document.getElementById("tabMotor1");
  var tabMotor2Obj = document.getElementById("tabMotor2");
  var tabMotor3Obj = document.getElementById("tabMotor3"); 
  
  var menuObj = document.getElementById("menu");
  var liObject = parent.document.getElementById('tabMotor'+[motorNumber]).getElementsByTagName('a');

  for (var i = 0; i < liObject.length; ++i)
  	{
 	    if (0 == i)
 		     liObject[i].className = "active";
 	    else
 		     liObject[i].className = "";
 	  }         
  
  
  var valDec = new Array(4);
   valDec[1] = 0;
   valDec[2] = 0;
   valDec[3] = 0;
    
   var liObject         = document.getElementById('tabMotor'+[motorNumber]).getElementsByTagName('a');
   valDec[motorNumber]  = parent.document.getElementById('Tab'+[motorNumber]+'manager').innerHTML ;
        
   for(var i=0;i<9;i++)
    {
      if(((valDec[motorNumber])>>>i)&1)  liObject[i].style.display = '';
      else                               liObject[i].style.display = 'none';
    }  
  
    //motor 1
    if(motorNumber==1)
    { 
      activePage.src = defaultPageMotor1;

      tabMotor1Obj.style.display='';
      tabMotor2Obj.style.display='none';  
      tabMotor3Obj.style.display='none';      
      menuObj.style.backgroundColor='rgb(53,58,63)';
      
      if(!radioMotor1Obj.checked)
      {  
        radioMotor1Obj.checked = true;
        radioMotor2Obj.checked = false; 
        radioMotor3Obj.checked = false;
      }
     }  
    
     // motor 2
    if(motorNumber==2)  
    {  
      activePage.src = defaultPageMotor2;
      
      tabMotor1Obj.style.display='none';
      tabMotor2Obj.style.display='';  
      tabMotor3Obj.style.display='none';  
      menuObj.style.backgroundColor='rgb(26,75,92)';
      
      if(!radioMotor2Obj.checked)
      {  
        radioMotor1Obj.checked = false;
        radioMotor2Obj.checked = true; 
        radioMotor3Obj.checked = false;
      }
     }
     
     // motor 3
    if(motorNumber==3)  
    {  
      activePage.src = defaultPageMotor3;
      
      tabMotor1Obj.style.display='none';
      tabMotor2Obj.style.display='none';  
      tabMotor3Obj.style.display='';  
      //menuObj.style.backgroundColor='rgb(79,120,24)';
      menuObj.style.backgroundColor='rgb(53,80,16)';
      
      if(!radioMotor3Obj.checked)
      {  
        radioMotor1Obj.checked = false;
        radioMotor2Obj.checked = false; 
        radioMotor3Obj.checked = true;
      }
     }
  // }

 } 
 
/***************************************************************************//*!
*
* @brief   The function return number of active motor
* @param   
* @return  motor number
* @remarks 
******************************************************************************/
function getActiveMotor()
{
    var object1     = null;
    var object2     = null;
    var object3     = null;
    
    object1 = parent.document.getElementById("radioMotor1");
    object2 = parent.document.getElementById("radioMotor2");
    object3 = parent.document.getElementById("radioMotor3");
    
    
    if(object1)
    {  
      if(object1.checked)
      {
        return 'M1_';
      }
      else if(object2.checked)
      {
        return 'M2_';
      }
      else if(object3.checked)
      {
        return 'M3_';
      }  
    }
    else
    {
      return '';
    }
}

/***************************************************************************//*!
*
* @brief   The function return number of active motor
* @param   
* @return  motor number
* @remarks 
******************************************************************************/
function getActiveMode()
{
    
    if(parent.document.getElementById("idTunningMode").value==1)
      return 1;
    else
      return 0;  
}

/***************************************************************************//*!
*
* @brief   The function return number of active motor
* @param   
* @return  motor number
* @remarks 
******************************************************************************/
function setActiveMode()
{
    var object = null;
    var activePage = parent.document.getElementById('mainFrame');
    var activeMode = parent.document.getElementById("idTunningMode").value;
    var motorTab = getActiveMotor();
    
    if (motorTab=="M1_")
        motorTab = "tabMotor1";         
    
    if (motorTab=="M2_")
        motorTab = "tabMotor2";
            
    if (motorTab=="M3_")
        motorTab = "tabMotor3";
    
    objectMode = parent.document.getElementById("Mode");
    if(objectMode)
    {
      if(activeMode==1)
          objectMode.innerHTML='Expert';
      else 
           objectMode.innerHTML='Basic';
    
      // store Setting
      paramFileWriteData("Setting_");
    
          
      //  change active menu item
      var liObject = parent.document.getElementById(motorTab).getElementsByTagName('a');
      for (var i = 0; i < liObject.length; ++i)
    	{
        if (liObject[i].className == "active")
            if (tabHTMLFiles[i]!="")
              {
                activePage.src = tabHTMLFiles[i];
              }  
  	  }  
      
    }
    
     
}
 
/***************************************************************************//*!
*
* @brief   The function mark background color of input elemements where value 
*          were changed
* @param   formName - name of Form section on active control page
*          varLabel - input box where changed was done
* @return  None
* @remarks 
******************************************************************************/
function markChangedInput(varID)
{
    var object     = null;
    //get active motor to selct proper prefix
    var prefixM = getActiveMotor();

    // add prefix to var ID
    if(prefixM!='')
      var paramTableID = 'paramTable'+prefixM;
    
    object      = document.getElementById(varID);
    
    // change color only of editable parmateters
    if(!(object.readOnly))
    { 
      if(document.getElementById("StoreData") != undefined)
        document.getElementById("StoreData").disabled = false;
        
      if(document.getElementById("ReloadData") != undefined)
        document.getElementById("ReloadData").disabled = false;  
      
      // store new value to main tab
      parent.document.getElementById(varID).innerHTML = object.value;
        
      // change input form bacground to see that value was changed
      object.style.background = 'rgb(250,183,153)';
      parent.document.getElementById(varID).style.color="red"; 
      // change color of paramter tab DIV to reflect modified input
      parent.document.getElementById(paramTableID).style.color="red";
    } 

    // update active tab constants
    updateTab();

 } 


/***************************************************************************//*!
*
* @brief   The function set new control page in defined iFrame
* @param   pageName - name of required HTML to be shown
*          iFrame - iFrame name
* @return  None
* @remarks 
******************************************************************************/
function setActivePage(tabMotorId, pageName,liNumber) 
{
    var activePage = document.getElementById('mainFrame');
    var status = false;
    
    // set new page if it's allowed   
    activePage.src = pageName;
    
    //  change active menu item
    if(liNumber < 10){
      var liObject = parent.document.getElementById(tabMotorId).getElementsByTagName('a');
      for (var i = 0; i < liObject.length; ++i)
    	{
  	    if (liNumber == i)
  		     liObject[i].className = "active";
  	    else
  		     liObject[i].className = "";
  	  }  
    }
      
}   
 
/***************************************************************************//*!
*
* @brief   The function creates multi-motor selector
* @param   
* @return  None
* @remarks 
******************************************************************************/ 
function build_multi_motor_selector(defaultChecking)
{
  	var string = "";
    // motor 1
      string = string + "<div id =\"idMotor1Tab\" style=\"display:none; vertical-align:middle; font-family: Arial; color:white; background-color=rgb(53,58,63); height: 30px; width: 150; POSITION: absolute; LEFT: 0px; TOP:72px\">";    
      string = string + "<font style=\"padding-left: 0.5cm; font-size: 13px; POSITION: relative; LEFT: 10px; TOP:7px\">Motor 1:</font>";
      string = string + "<font id =\"M1typeTabName\" style=\"padding-left: 0.5cm; font-size: 13px; POSITION: relative; LEFT: 10px; TOP:7px\"></font>";
      string = string + "</div>";
      // radio button to select actual motor setting
      string = string + "<div id =\"idMotor1Rad\" style=\"display:none; vertical-align:middle; font-family: Arial; background-color=rgb(53,58,63); height: 30px; width: 50px; POSITION: absolute; LEFT: 150px; TOP: 72px\">";
      if(defaultChecking==1)
        string = string + "<input type=\"radio\" id=\"radioMotor1\"  style=\"POSITION: relative; LEFT: 10px; TOP:5px \" onClick=\"selectMotor(1)\" value=\"1\" checked>";
      else
        string = string + "<input type=\"radio\" id=\"radioMotor1\"  style=\"POSITION: relative; LEFT: 10px; TOP:5px \" onClick=\"selectMotor(1)\" value=\"1\" >";               
      string = string + "</div>"; 
    
    
    // motor 2 
      string = string + "<div id =\"idMotor2Tab\" style=\"display:none; vertical-align:middle; font-family: Arial; color:white; background-color=rgb(26,75,92); height: 30px; width: 150px; POSITION: absolute; LEFT: 220px; TOP: 72px\">";    
      string = string + "<font style=\"padding-left: 0.5cm; font-size: 13px; POSITION: relative; LEFT: 10px; TOP:7px\">Motor 2:</font>";
      string = string + "<font id =\"M2typeTabName\" style=\"padding-left: 0.5cm; font-size: 13px; POSITION: relative; LEFT: 10px; TOP:7px\"></font>";                   
      string = string + "</div>";
      // radio button to select actual motor setting
      string = string + "<div  id =\"idMotor2Rad\" style=\"display:none; vertical-align:middle; font-family: Arial; background-color=rgb(26,75,92); height: 30px; width: 50px; POSITION: absolute; LEFT: 370px; TOP: 72px\">";
      if(defaultChecking==2)
        string = string + "<input type=\"radio\" id=\"radioMotor2\"   style=\"POSITION: relative; LEFT: 10px; TOP:5px \" onClick=\"selectMotor(2)\" value=\"2\" checked>";             
      else
        string = string + "<input type=\"radio\" id=\"radioMotor2\"   style=\"POSITION: relative; LEFT: 10px; TOP:5px \" onClick=\"selectMotor(2)\" value=\"2\" >";
      string = string + "</div>";
     
    // motor 3 
  
      string = string + "<div id =\"idMotor3Tab\" style=\"display:none; vertical-align:middle; font-family: Arial; color:white; background-color=rgb(53,80,16); height: 30px; width: 150px; POSITION: absolute; LEFT: 440px; TOP: 72px\">";    
      string = string + "<font style=\"padding-left: 0.5cm; font-size: 13px; POSITION: relative; LEFT: 10px; TOP:7px\">Motor 3:</font>";
      string = string + "<font id =\"M3typeTabName\" style=\"padding-left: 0.5cm; font-size: 13px; POSITION: relative; LEFT: 10px; TOP:7px\"></font>";                   
      string = string + "</div>";
      // radio button to select actual motor setting
      string = string + "<div id =\"idMotor3Rad\" style=\" display:none; vertical-align:middle; font-family: Arial; background-color=rgb(53,80,16); height: 30px; width: 50px; POSITION: absolute; LEFT: 590px; TOP: 72px\">";
      if(defaultChecking==3)
        string = string + "<input type=\"radio\" id=\"radioMotor3\"  style=\"POSITION: relative; LEFT: 10px; TOP:5px \" onClick=\"selectMotor(3)\" value=\"3\" checked>";             
      else
        string = string + "<input type=\"radio\" id=\"radioMotor3\"  style=\"POSITION: relative; LEFT: 10px; TOP:5px \" onClick=\"selectMotor(3)\" value=\"3\" >";
      string = string + "</div>";
      
      // tuning mode selector
      string = string + "<div id =\"idModeSelector\" style=\"display:; vertical-align:middle; font-family: Arial; color:white; background-color=rgb(195,199,204); height: 30px; width: 190px; POSITION: absolute; LEFT: 660px; TOP: 72px\">";    
      string = string + "<font style=\"padding-left: 0.5cm; font-size: 13px; vertical-align:middle; POSITION: relative; LEFT: 0px; TOP: 4px; \">Tuning Mode:</font>";
      string = string + "<td width=\"10%\"><select id=\"idTunningMode\"  \" onClick =\"\" onChange =\"setActiveMode()\" onBlur=\"\" size=\"1\" style=\"padding-left: 0.5cm; font-size: 13px; vertical-align:middle; POSITION: relative; LEFT: 10px; TOP: 4px; \">"; 
      string = string + "<option value=\"0\">Basic</option>"; 
      string = string + "<option value=\"1\">Expert</option></select></td>";
      string = string + "</div>";
          
  	return string;
}
 
  
/***************************************************************************//*!
* build_control_structure_line_with_selector( varID, lineName,inputLabel1, unit1, inputComment1)
* @brief   The function creates code of input parameter
* @param   varLabel - visible label of pramater
*          varID    - HTML unique ID
*          varUnit  - input parameter Unit                                                                                                                        
*          valComment - help text which is active MouseOn event on varLabel
*          inObj - optional input object
*          inObjDescr - descritpion of optional input object
* @return  None
* @remarks 
******************************************************************************/        
function build_parameter_line( varLabel, varID, varUnit, varComment, inObj, inObjDescr)
{
    var optionalObject =  inObj; 
  	// hidden parameter
    if(optionalObject == -1)
      var string = "<tr style=\"display:none;\">";
    else
      var string = "<tr>";  
	  var onchange = "";  
    var varIDprefix="";
    var varUnitField = "";
    
    if(varUnit!='')
      varUnitField = '[' + varUnit + ']';    
    //get active motor to selct proper prefix
    var prefixM = getActiveMotor();

    // add prefix to var ID
    if(prefixM!='')
      varIDprefix = prefixM + varID; 
	
	 // parameter name + comment when mouse moves over
    string = string + "<td align=\"left\" valign=\"middle\" width=35% style=\"font-family:Arial; font-size:12px; padding-left:0.3cm\"> <label id = \"parText" + varLabel + "\" title=\"" + varComment + "\" >" + varLabel + "</label> </td>";
	 // next column
    string = string + "<td valign=\"top\" width=25%>";
	 // input box with event "onchage"
    string = string + "<div style=\"float:left; width:10px;\"><input type=\"text\" style=\"text-align:right; font-size: 12px; \" id=\"" + varIDprefix + "\" onkeydown=\"return checkEnterPress(event,id)\" onblur=\"return checkIt(event,id)\" onchange =\"markChangedInput('" + varIDprefix + "');  \"  name=\"" + varLabel + "\"size=\"6\" value=\"0\" ></div></td>";
	 // add param unit
    string = string + "<td valign=\"center\" width=\"25%\" style=\"font-family: Arial; font-size: 12px;\">" + varUnitField + "</td>";
    // optional input object
    // no object
    if(optionalObject == 0)
    {
      string = string + "</td><td valign=\"top\" width= 15%>&nbsp;</td><td>";
    }
    //checkbox
    if(optionalObject == 1)
    {
      string = string + "</td><td valign=\"top\" width=15% style=\"font-family:Arial; font-size: 12px;\"><input type=\"checkbox\" id=\"checkBox" + varIDprefix + "\" value=\"0\" >" + inObjDescr + "</td><td>";
  	}
    // button
    if(optionalObject == 2)
    {
      string = string + "</td><td valign=\"top\" width=15%><button id=\"button" + varID + " value=\"0\" onclick=\"calc_" + varID + "(1)\" >" + inObjDescr + "</td><td>";
  	}
    // radi button
    if(optionalObject == 3)
    {
      string = string + "</td><td valign=\"top\" width=15% style=\"font-family:Arial; font-size: 12px;\"><input type=\"radio\" id=\"radio" + varIDprefix + "\" value=\"1\" onclick=\"clickRadio('"+ varID + "')\" >" + inObjDescr + "</td><td>";
  	}
    // end table
    string = string + "</td></tr>";
  	return string;
}

/***************************************************************************//*!
*
* @brief   The function divides line with optional title
* @param   title - text shown in empty line (optional)
*          
* @return  None
* @remarks 
******************************************************************************/ 
function build_divider_line(title)
{
  	var string = "<tr>";
  	
  	string = string + "<td colspan=\"7\" align=\"center\" style=\"padding-left:0.3cm\">";
    string = string + "<div class=\"fontControlLabelSet\">&nbsp" + title + " </div>";             
    string = string + "</td></tr>";
  
  	return string;
}

/***************************************************************************//*!
*
* @brief   The function divides line with optional title
* @param   title - text shown in empty line (optional)
*          
* @return  None
* @remarks 
******************************************************************************/ 
function build_informative_line(varID, title, out_string)
{
  	var string = "<tr>";
  	
  	string = string + "<td colspan=\"1\" width=\"50%\" style=\"padding-left:0.3cm\">";
    string = string + "<div class=\"fontControlLabelSet\">&nbsp" + title + " </div></td>";             
  	string = string + "<td colspan=\"1\" align=\"left\" style=\"font-family: Arial; font-size: 12px;\">";
    string = string + "<div id=\""+varID+"\">&nbsp" + out_string + " </div>";
    string = string + "</td></tr>";
  
  	return string;
}

/***************************************************************************//*!
*
* @brief   The function creates code of for output constant
* @param   varLabel - visible label of pramater
*          varID -  constant unique ID
*          valComment - help text which is active MouseOn event on varLabel
* @return  None
* @remarks 
******************************************************************************/ 
function build_constant_line( varLabel, varID, valComment)
{
	 var string = "<tr>";
	 var onchange = "";
  	 
  	//string = string + "<td align=\"left\" valign=\"top\" width=1> </td>";
  	string = string + "<td align=\"left\" valign=\"middle\" width=45% style=\"font-family: Arial; font-size: 12px; padding-left:0.3cm\"> <label id = \"constText" + varLabel + "\" title=\"" + valComment + "\" >" + varLabel + "</label> </td>";
    
  	string = string + "<td valign=\"top\" width=30%>";
  	string = string + "<div style=\"float:left; width:10px;\"><input type=\"text\" style=\"text-align:right; font-family: Arial; background-color=rgb(195,199,204); font-size: 12px;\" id=\"" + varID + "\" name=\"" + varLabel + "\"size=\"5\" value=\"0\"></div>";
  	string = string + "</td></tr>";
  	return string;
}


/***************************************************************************//*!
*
* @brief   The function creates code of control structure line
* @param   varID - ID of inut form
*          varLabel - visible label of pramater
*          inputLabel1  - label above first input form
*          inputLabel2  - label above second input form
*          valComment1 - help text which is active Mouse over event on input 1
*          valComment1 - help text which is active Mouse over event on input 2
* @return  None
* @remarks 
******************************************************************************/ 
function build_control_structure_line( varID, lineName,inputLabel1, unit1, inputLabel2, unit2, inputComment1,inputComment2)
{
    var string = "<tr>";
	 
	  string = string + "<td width=\"25%\" valign=\"center\"><div class=\"fontControlLabelS1\" style=\"padding-left:0.0cm\">" + lineName + "</div></td>";             
    string = string + "<td rowspan =\"2\" id=\"" + varID + "\" onClick=\"Ctrl_Structure_click(id)\" class=\"switch_off\">DISABLED</td>";
      
    if(inputLabel2!="")
    {
      string = string + "<td width=\"20%\" valign=\"center\"><div class=\"fontControlLabelS\" style=\"padding-left:0.2cm\">" + inputLabel1 + "</div></td>"; 
      string = string + "<td width=\"10%\" valign=\"center\"> <input  type = \"text\", maxlength=\"6\" size=\"6\" id = \"" + varID + "_Input1\" onkeydown=\"return checkItCS(event,id)\" title=\"" + inputComment1 + "\"> </td>";
      string = string + "<td width=\"5%\" valign=\"center\"><div class=\"fontControlLabelS\">" + unit1 + "</div></td>";
    }
    else
    {
      string = string + "<td rowspan =\"2\" width=\"20%\" valign=\"center\"><div class=\"fontControlLabelS\" style=\"padding-left:0.2cm\">" + inputLabel1 + "</div></td>"; 
      string = string + "<td rowspan =\"2\" width=\"10%\" valign=\"center\"> <input  type = \"text\", maxlength=\"6\" size=\"6\" id = \"" + varID + "_Input1\" onkeydown=\"return checkItCS(event,id)\" title=\"" + inputComment1 + "\"> </td>";
      string = string + "<td rowspan =\"2\" width=\"5%\" valign=\"center\"><div class=\"fontControlLabelS\">" + unit1 + "</div></td>";
    }
     
     string = string + "</tr>";
     string = string + "<tr>";
                              
     string = string + "<td width=\"25%\" valign=\"center\" style=\"text-align: center;\"><input type=\"button\" value=\"view\" onclick=\"clickCntStrImage("+varID+")\" class=\"fontControlLabelS\" style=\"padding-left:0.3cm; \"></td>";
     if(inputLabel2!="")
     {
        string = string + "<td  width=\"20%\" valign=\"center\"><div class=\"fontControlLabelS\" style=\"padding-left:0.2cm\" >" + inputLabel2 + "</div></td>";
        string = string + "<td  valign=\"center\"> <input  type = \"text\" maxlength=\"6\" size=\"6\" id = \"" + varID + "_Input2\"  onkeydown=\"return checkItCS(event,id)\" title=\"" + inputComment2 + "\"> </td>";
     }
     string = string + "<td width=\"10%\" valign=\"center\"><div class=\"fontControlLabelS\">" + unit2 + "</div></td>";
     

    string = string + "</tr>"; 
 
  	return string;
}

/***************************************************************************//*!
*
* @brief   The function creates code of for output constant
* @param   varLabel - visible label of pramater
*          varID -  constant unique ID
*          valComment - help text which is active MouseOn event on varLabel
* @return  None
* @remarks 
******************************************************************************/ 
function build_control_structure_line_inbox_selector( varID, lineName,inputLabel1, unit1, unit2, inputComment1,inputComment2)
{
    var string = "<tr>";
    
    string = string + "<td width=\"25%\" valign=\"center\"><div class=\"fontControlLabelS1\" style=\"padding-left:0.1cm\">" + lineName + "</div></td>";             
    string = string + "<td rowspan =\"2\" id=\"" + varID + "\" onClick=\"Ctrl_Structure_click(id)\" class=\"switch_off\">DISABLED</td>";
  
    string = string + "<td width=\"20%\" valign=\"center\"><div class=\"fontControlLabelS\" style=\"padding-left:0.2cm\">" + inputLabel1 + "</div></td>"; 
    string = string + "<td width=\"10%\" valign=\"center\"> <input  type = \"text\", maxlength=\"6\" size=\"6\" id = \"" + varID + "_Input1\" onkeydown=\"return checkItCS(event,id)\" title=\"" + inputComment1 + "\"> </td>";
    string = string + "<td width=\"5%\" valign=\"center\"><div class=\"fontControlLabelS\">" + unit1 + "</div></td>";
    string = string + "</tr>";

    string = string + "<tr>";
    string = string + "<td width=\"10%\" valign=\"center\" style=\"text-align: center;\"><input type=\"button\" value=\"view\" onclick=\"clickCntStrImage("+varID+")\" class=\"fontControlLabelS\" style=\"padding-left:0.3cm;\"></td>";
    string = string + "<td width=\"10%\" valign=\"center\"><select id=\"" + varID + "_Select\" onClick =\"stopCountInterval()\" onChange =\"IdMethodChange(this.value)\" onBlur=\"timeUpdate()\" size=\"1\">"; 
    string = string + "<option value=\"0\">Id = manual</option>";
    string = string + "<option value=\"1\">Id = MTPA</option>";
    string = string + "<option value=\"2\">Id = FW</option></select> </td>";
    
    string = string + "<td  valign=\"center\"> <input  type = \"text\" maxlength=\"6\" size=\"6\" value = \"0\" id = \"" + varID + "_Input2\"  onkeydown=\"return checkItCS(event,id)\" title=\"" + inputComment2 + "\"> </td>";
    string = string + "<td width=\"10\" valign=\"center\"><div class=\"fontControlLabelS\">" + unit2 + "</div></td>";
    string = string + "</tr>"; 
 
  	return string;
}

/***************************************************************************//*!
*
* @brief   The function creates code of for output constant
* @param   varLabel - visible label of pramater
*          varID -  constant unique ID
*          valComment - help text which is active MouseOn event on varLabel
* @return  None                                                                 
* @remarks 
******************************************************************************/ 
function build_control_structure_line_with_selector( varID, lineName,inputLabel1, unit1, inputComment1)
{
    var string = "<tr>";
	 
	  string = string + "<td rowspan =\"2\" width=\"25%\" valign=\"center\"><div class=\"fontControlLabelS1\" style=\"padding-left:0.1cm\">" + lineName + "</div></td>";             
    string = string + "<td rowspan =\"2\" id=\"" + varID + "\" class=\"switch_off\">DISABLED</td>";
  
    string = string + "<td width=\"20%\" valign=\"center\"><div class=\"fontControlLabelS\" style=\"padding-left:0.2cm\">" + inputLabel1 + "</div></td>"; 
    string = string + "<td width=\"10%\" valign=\"center\"><select id=\"" + varID + "_Select\" onClick =\"stopCountInterval()\" onChange =\"sensorTypeChange(this.value)\" onBlur=\"timeUpdate()\" size=\"1\">"; 
    string = string + "<option value=\"0\">resolver</option>"; 
    string = string + "<option value=\"1\">encoder</option>";
    string = string + "<option value=\"2\">sensorless</option>";
    string = string + "<option value=\"3\">hall</option>";
    string = string + "<option value=\"4\">sincos</option></select></td>";
    string = string + "<td width=\"5%\" valign=\"center\"><div class=\"fontControlLabelS\">" + unit1 + "</div></td>";

    string = string + "</tr>"; 
 
  	return string;
} 



/***************************************************************************//*!
*
* @brief   The function checks input characters to forms. Enables only numbers
* @param   Event
* @return  true - if number was put
*          false - different character was put
* @remarks 
******************************************************************************/
function checkIt(evt,id) {
   
    object = document.getElementById(id);

    if(isNaN(object.value)) 
    {
        alert("The field '" + object.name + "' accepts numbers only!");
        status = "This field accepts numbers only.";
        object.style.background = "transparent";
        object.focus();
        return false  
    }
    else
    {
        status = "";
        return true
    }
       
}       

/***************************************************************************//*!
*
* @brief   The function checks input characters to forms. Enables only numbers
* @param   Event
* @return  true - if number was put
*          false - different character was put
* @remarks 
******************************************************************************/
function checkItCS(evt,id) {
    evt = (evt) ? evt : window.event
    var charCode = (evt.which) ? evt.which : evt.keyCode
    var object =  document.getElementById(id);
    
    if ((charCode > 47 && charCode < 58) || (charCode > 95 && charCode < 106)|| charCode == 110 || charCode == 190 ||charCode == 8 || charCode ==109 ||  charCode ==39 || charCode ==37 || charCode == 13 || charCode == 9 || charCode == 127 || charCode == 46)
    {
        status = "";
        return true
    }
    else
    {
        alert("This field accepts numbers only!")
        status = "This field accepts numbers only."
        return false
    }
}

/***************************************************************************//*!
*
* @brief   The function checks pressing of ENTER
* @param   Event
* @return  true - enter was pressed
*          false - different key was pressed
* @remarks 
******************************************************************************/
function checkEnterPress(evt,id) {
    
    // check enter pressing
    evt = (evt) ? evt : window.event
    var charCode = (evt.which) ? evt.which : evt.keyCode 
    if(charCode==13)
    {   
        object = document.getElementById(id);
        if(isNaN(object.value)) 
        {
          object.blur();
        }
        else
        {
          markChangedInput(id);
          return true
        }
    }
    
}    
/***************************************************************************//*!
* 
******************************************************************************
* End of code
******************************************************************************/
