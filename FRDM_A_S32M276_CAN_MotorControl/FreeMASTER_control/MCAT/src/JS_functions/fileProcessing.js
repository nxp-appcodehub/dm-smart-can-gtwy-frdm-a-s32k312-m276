// JavaScript Document

/*******************************************************************************
*
* Copyright 2006-2015 Freescale Semiconductor, Inc.
* Copyright 2016-2017 NXP
*
****************************************************************************//*!
*
* @file   fileProcessing.js
*
* @brief  read/write file routines within a Wizard tool
*
* @version 1.0.1.0
* 
* @date May-6-2014
* 
******************************************************************************/

/******************************************************************************
* List of functions
********************************************************************************
*
* coversionMotorsNumber(inPointer) -
* initLoadParamFiles() - 
* clickReloadData() - 
* clickStoreData() -
* unmarkInputColor() -
* paramFileReadData(tableType) -
* paramFileWriteData(tableType) -
    
*******************************************************************************/


/***************************************************************************//*!
* @brief   The function converts "Number of motors" from String to Number form
* @param   
* @return  None
* @remarks 
*******************************************************************************/       
function coversionMotorsNumber(inPointer)
{
    var arithmeticArray=new Array(3);
    arithmeticArray[1] = "Single";
    arithmeticArray[2] = "Dual";
    arithmeticArray[3] = "Triple";

    for(i=1;i<4;i++){
      if(inPointer== arithmeticArray[i])     
        return (i);
    }
}
      
/***************************************************************************//*!
* @brief   The function runs script after page load
* @param   
* @return  None
* @remarks 
*******************************************************************************/    
function initLoadParamFiles()
{
  // read all param and setting files
    if (paramFileReadData('M1_')==1)
    return;                   // exit the function if there is an error in reading of the file
    if (paramFileReadData('M2_')==2)
    return;                   // exit the function if there is an error in reading of the file
    if (paramFileReadData('M3_')==3)
    return;                   // exit the function if there is an error in reading of the file
  if (paramFileReadData('Setting_')==1)
    return;               // exit the function if there is an error in reading of the file
 
  //  get number of active motors
  var valDec = new Array(4);
  valDec[1] = 0;
  valDec[2] = 0;
  valDec[3] = 0;
    
  var MotorsNumber      = parent.document.getElementById('MotorsNo').innerText; 
  var MotorsNumber_No   = coversionMotorsNumber(MotorsNumber);  
  
  //var cc = parent.document.getElementById("MCATcode").innerText;
  //var x  = parent.document.getElementById("settingTab");
  
  //if(cc!=1009)  x.style.display = "none";

  for(var i=1; i<4; i++)
    {
     document.getElementById('idMotor'+[i]+'Rad').style.display = 'none';
     document.getElementById('idMotor'+[i]+'Tab').style.display = 'none';
            
     if(i<(MotorsNumber_No+1)){
       document.getElementById('idMotor'+[i]+'Rad').style.display = '';
       document.getElementById('idMotor'+[i]+'Tab').style.display = '';
       }
     
      // read the name of selected motor and plot it in radio-button motor selector  
     document.getElementById('M'+[i]+'typeTabName').innerHTML  = parent.document.getElementById('M'+ [i] + 'type').innerHTML; 
     } 
     
   // Display only selected tabs for each motor after reload page  
    for (var j=0; j < (MotorsNumber_No); j++)
     {
        var liObject   = document.getElementById('tabMotor'+[j+1]).getElementsByTagName('a');
        valDec[j+1]    = parent.document.getElementById('Tab'+[j+1]+'manager').innerHTML ;
        
        for(var i=0;i<9;i++)
        {
         if(((valDec[j+1])>>>i)&1)
           liObject[i].style.display = '';
         else
           liObject[i].style.display = 'none';
        }  
     }  
     
     
    var mode = parent.document.getElementById('Mode').innerText;
    
    // set proper Mode based on information stored in Setting.txt
    if(mode=='Basic')
      document.getElementById('idTunningMode').value = 0;
    if(mode=='Expert')
      document.getElementById('idTunningMode').value = 1; 
          
} 

/***************************************************************************//*!
*
* @brief   
* @param   
* @return  None
* @remarks 
******************************************************************************/
function clickReloadData()
{
  //get active motor
  var prefixM = getActiveMotor();
  
  // read parameter from external parameter file
  paramFileReadData(prefixM); 
 
  // disable buttons
  ReloadStoreButtonsOnOff(0);

  // changed background of cahnged input back to white
  unmarkInputColor();
}
   
/***************************************************************************//*!
*
* @brief   
* @param   
* @return  None
* @remarks 
******************************************************************************/
function clickStoreData()
{
    if(document.getElementById("settingTab") != undefined)
    {
      var prefixM = "Setting_";
      // write data to param file
      paramFileWriteData(prefixM);
    }
    else
    {
      //get active motor
      var prefixM = getActiveMotor();
    
      // write data to param file
      paramFileWriteData(prefixM);
 
      // disable buttons
      ReloadStoreButtonsOnOff(0);
      
      // changed background of cahnged input back to white
      unmarkInputColor();
     }
}  

/***************************************************************************//*!
*
* @brief   The function checks all input elements in active page prior the page 
*          is closed to inform about unsaved data
* @param   iFrame - name of Form section on active control page
*
* @return  backToPage - true / false
* @remarks 
******************************************************************************/
function unmarkInputColor()
{   
    var allTagInputs = document.getElementsByTagName("input");
    var i=0;
    var prefixM = getActiveMotor();

    // add prefix to var ID
    if(prefixM!='')
      var paramTableID = 'paramTable' + prefixM;
     
    // check page input element on background color
    for(i=0;i<(allTagInputs.length);i++)
    { 
      if(allTagInputs[i].style.background=='rgb(250,183,153)')
        allTagInputs[i].style.background = "white";
    }
    
    //clear color of param tab
    parent.document.getElementById(paramTableID).style.color="black";
    
    // clear red color of inner ID elements
    itemNumber = (parent.document.getElementById(paramTableID).name).split(",");
    for (i=0;i<itemNumber.length-1;i++)
    { 
       parent.document.getElementById(prefixM + itemNumber[i]).style.color="black";                                    
    }
}

/***************************************************************************//*!
*
* @brief   The function checks all input elements in active page prior the page 
*          is closed to inform about unsaved data
* @param   iFrame - name of Form section on active control page
*
* @return  backToPage - true / false
* @remarks 
******************************************************************************/
function paramFileReadData(tableType)
{
    var fileStatus;
    var charNumber;
    var inputFileString;
    var stringItems;
    var constantNameString = "";
    var idPrefix = "";
    
    // check the prefix
    if(tableType != 'Setting_')
        idPrefix = tableType;
    // open file for reading

    var paramFile = pcm.LocalFileOpen("MCAT/param_files/" + tableType +"params.txt","r");
    
    // read file content and store it in string
    charNummber = pcm.LocalFileReadString(paramFile);
    // separate lines 
    if(charNummber>0)
      inputFileString = pcm.LastLocalFile_string.split("\r\n");
    else
    {
      alert('Error - empty file, or file is read only. Check "read only" attribute in all parameter files - MCAT/param_files/M1_params.txt ...');
      return(1);
    }  

    
    //store input constant to internal tab
    var paramTable = "";
    var i = 0;
    paramTable += "<table border='1' align='center' cellspacing = '1' style=\"font-weight: bold; font-size:7\">"; 
    
    // get data from param file and store them in table string
    for (i=0;i<inputFileString.length;i++)
    { 
       paramTable += "<tr>";
      //separate constant name and value
      stringItems = inputFileString[i].split("=");
      // store constant name in string with comma separator
      constantNameString = constantNameString + stringItems[0] + ",";
      paramTable += "<td id='"+ idPrefix + stringItems[0] +"'>" + stringItems[1] + "</td>";
      
      paramTable += "</tr>";
    }  
    paramTable += "</table>" 
  
    // store entire parameter tab in MainPage
    parent.document.getElementById("paramTable"+ tableType).innerHTML =paramTable;
    // name parameter tab as tring of param names
    parent.document.getElementById("paramTable"+ tableType).name = constantNameString;
    
    // close param file
    fileStatus = pcm.LocalFileClose(paramFile);
    if(fileStatus = false)
      alert('File closing error');
}  

/***************************************************************************//*!
*
* @brief   The function checks all input elements in active page prior the page 
*          is closed to inform about unsaved data
* @param   iFrame - name of Form section on active control page
*
* @return  backToPage - true / false
* @remarks 
******************************************************************************/
function paramFileWriteData(tableType)
{
  var fileStatus;
  var charNumber;
  var outputFileString = "";
  var itemNumber;
  var i=0;
  
  // open file for writting
  //var paramFile = pcm.LocalFileOpen("MCAT/param_files/" + tableType +"params.txt","w");
  var paramFile = pcm.LocalFileOpen("MCAT/param_files/" + tableType +"params.txt","w");

  // get number of output parameters
  itemNumber = (parent.document.getElementById("paramTable" + tableType).name).split(","); 
  // get data from param file and store them in table string
  for (i=0;i<itemNumber.length-1;i++)
  { 
    // get output string in format: ConstantName=Value\n
    outputFileString = outputFileString + itemNumber[i] + "=" + getParentHtmlValue(itemNumber[i]) + "\r\n";
  }

  // remove last \n
  outputFileString = outputFileString.substr(0,outputFileString.length-2);
  
  // write string to output file
  charNumber = pcm.LocalFileWriteString(paramFile,outputFileString); 
  
  // close param file
  fileStatus = pcm.LocalFileClose(paramFile);
  if(fileStatus = false)
    alert('File closing error');
} 

/***************************************************************************//*!
* 
******************************************************************************
* End of code
******************************************************************************/