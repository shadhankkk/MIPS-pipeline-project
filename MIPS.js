// the text area for input
const inputElem = document.getElementById("mips-input");
let inputString = inputElem.value;
let labels = {};
let labelSet = new Set();
let arrayDict = {};
let instrSeq = [];
let memorySim = {};
let preProcDir = -1;
let forwarding = false;
let earlyBranching = false;
let branchPrediction = false;
let branchPredictionTaken = false;
let branchPredictionNotTaken = false;
let delayedBranching = false;

// MIPS INSTR TYPES

let Rset = new Set();
let Rarray = ['add', 'and', 'nor', 'or', 'slt', 'sll', 'srl', 'sub'];
Rarray.forEach(codeName => Rset.add(codeName));

let Iset = new Set();
let Iarray = ['addi', 'andi', 'beq', 'bne', 'lui', 'lw', 'ori', 'slti', 'sw'];
Iarray.forEach(codeName => Iset.add(codeName));

let Jset = new Set();
let Jarray = ['j'];
Jarray.forEach(codeName => Jset.add(codeName));

//

console.log(getInputArray());
console.log(labels);
let processedInstructions = getInputArray().map(input => inputToComponents(input));
console.log(processedInstructions);

let varValueDict = {};
let varValueElemDict = {};
let temp = {};


let convertButtonElem = document.getElementById('convert-button');

addVars();
addPreProcVars();

let var_info_elem = document.getElementById('var-inputs');
let var_output_elem = document.getElementById('var-outputs');
console.log(varValueDict);

for (key of Object.keys(varValueDict)) {
  if(typeof labels[key] == 'string' && labels[key].substring(0,3) == '.ML') {
    continue;
  }
  var_info_elem.insertAdjacentHTML('beforeend',
                                   `<div class = "one-var-info"> 
                                      <div class = "var-label">${key}:</div> 
                                      <input id = 'var-input-${key}' class = 'var-input-box' type = 'text' value = ${varValueDict[key]}>
                                    </div>`);
  varValueElemDict[key] = document.getElementById(`${key}`);
}

let currInstr = 0;

function initialize() {
  var_output_elem.innerHTML = '';
  labels = {};
  labelSet = new Set();
  arrayDict = {};
  instrSeq = [];
  preProcDir = -1;
  processedInstructions = getInputArray().map(input => inputToComponents(input));
  console.log(processedInstructions);
  varValueDict = {};
  varValueElemDict = {};
  memorySim = {};
  addPreProcVars();
  addVars();
  console.log(temp);
  for(key of Object.keys(varValueDict)) {
    if(temp.hasOwnProperty(key) && temp[key] != "undef") {
      varValueDict[key] = temp[key];
    }
  }
  var_info_elem = document.getElementById('var-inputs');
  var_info_elem.innerHTML='';
  let len = 0;
  for (key of Object.keys(varValueDict)) {
    if(typeof labels[key] == 'string' && labels[key].substring(0,3) == '.ML') {
      continue;
    }
    if(typeof varValueDict[key] == 'object') {
      console.log(key); 
      var_info_elem.insertAdjacentHTML('beforeend',
                                     `<div class = "one-var-info"> 
                                        <div class = "var-label">${key}:</div> 
                                        <input id = 'var-input-${key}' class = 'var-input-box' type = 'text' value = ${'[' + String(varValueDict[key]) + ']'}> </div>`);
    } else {
      var_info_elem.insertAdjacentHTML('beforeend',
                                     `<div class = "one-var-info"> 
                                        <div class = "var-label">${key}:</div> 
                                        <input id = 'var-input-${key}' class = 'var-input-box' type = 'text' value = ${varValueDict[key]}> </div>`);
    }
    varValueElemDict[key] = document.getElementById(`${key}`);
    len++;
  }

  currInstr = 0;
}

inputElem.addEventListener('blur', initialize);

convertButtonElem.onclick = () => {
  var_output_elem.innerHTML = '';
  addPreProcVars();
  console.log(varValueDict);
  instrSeq = [];
  for (key of Object.keys(varValueDict)) {
    if(typeof labels[key] == 'string' && labels[key].substring(0,3) == '.ML') {
      continue;
    }
    if((document.getElementById(`var-input-${key}`).value)[0] == '[') {
      let m = document.getElementById(`var-input-${key}`).value
                            .slice(1)
                            .slice(0, -1)
                            .split(',')
                            .map(num => Number(num.trim()));
                            
      varValueDict[key] = m;
    } else {
      if((document.getElementById(`var-input-${key}`).value).substr(0,3) == '.ML') {
        varValueDict[key] = document.getElementById(`var-input-${key}`).value;
      } else {
        varValueDict[key] = Number(document.getElementById(`var-input-${key}`).value);
      }
    }
  }
  console.log(varValueDict);
  for(key of Object.keys(varValueDict)) {
    if(temp[key] == 'undef') {
      if(varValueDict[key][0] == '[') {
        let m = document.getElementById(`var-input-${key}`).value
                            .slice(1)
                            .slice(0, -1)
                            .split(',')
                            .map(num => Number(num.trim()));
        temp[key] = '[' + String(m) + ']';
      } else {
        temp[key] = varValueDict[key];
      }
    }

    if(varValueDict[key] != temp[key]) {
      console.log(key);
      temp[key] = varValueDict[key];
    }
  }
  varValueDict['$0'] = 0;
  let len = processedInstructions.length;
  let executions = 0;
  console.log(processedInstructions);
  for(; currInstr < len; currInstr = currInstr + 1) {
    instrSeq.push(currInstr);
    console.log("EJFJOAFOSD", currInstr, varValueDict, memorySim);
    execute_instruction(processedInstructions[currInstr]);
    console.log(currInstr);
    console.log(currInstr, varValueDict);
    executions++;
    if(executions > 10000) {
      console.log("max executions hit");
      break;
    }
  }
  delete varValueDict['$0'];

  // for(arrKey in arrayDict) {
  //   let outputMsg = `Mem Location: ${arrayDict[arrKey][0]}, Length: ${arrayDict[arrKey][1]}`
  //   var_output_elem.insertAdjacentHTML('beforeend', 
  //                                      `<div class = "one-var-output"> 
  //                                          <div class = "var-label">${arrKey}:</div> 
  //                                          <div id = 'var-output-${arrKey}' class = 'var-output-box'>${outputMsg}</div>
  //                                        </div>`);
  // }

  for (key in varValueDict) {
    if(typeof labels[key] == 'string' && labels[key].substring(0,3) == '.ML') {
      continue;
    }
    let outputMsg;
    if(typeof varValueDict[key] == 'string' && varValueDict[key].substring(0,3) == '.ML') {
      let memPos = varValueDict[key].substring(3);
      let arrLabel;
      let arrPos;
      for(arrKey in arrayDict) {
        let baseMem = arrayDict[arrKey][0];
        let len = arrayDict[arrKey][1];
        if(memPos >= baseMem && memPos < baseMem + len) {
          arrLabel = arrKey;
          arrPos = memPos - baseMem;
          break;
        }
      }
    
      if(arrLabel == undefined || arrPos == undefined) {
        outputMsg = `Mem Location: ${varValueDict[key].substring(3)}`
      } else {
        outputMsg = '&' + arrLabel + '[' + arrPos + ']';
      }
    } else {
      outputMsg = varValueDict[key];
    }
    var_output_elem.insertAdjacentHTML('beforeend', 
                                        `<div class = "one-var-output"> 
                                            <div class = "var-label">${key}:</div> 
                                            <div id = 'var-output-${key}' class = 'var-output-box'>${outputMsg}</div>
                                          </div>`);
  }
  console.log(varValueDict);
  console.log("MEMORYSIM", memorySim);
  currInstr = 0;
  console.log(instrSeq);
  console.log("ARRAY DICT", arrayDict);

  startPipeline();
}

function getInputArray() {
  // extracts input lines but includes labels
  let inputsWithLabels;
  if(inputElem.value.includes('.text')) {
    preProcDir = inputElem.value.split('.text')[0];
    inputsWithLabels = inputElem.value
                                .split('.text')[1]
                                .split('\n')
                                .map(inptLn => inptLn.split("#")[0])
                                .filter(inptLn => inptLn.trim() != "");
  } else {
    inputsWithLabels = inputElem.value
                                .split('\n')
                                .map(inptLn => inptLn.split("#")[0])
                                .filter(inptLn => inptLn.trim() != "");
  }

  console.log(inputsWithLabels);
                                  
  // removes labels
  for(line in inputsWithLabels) {

    let instr = inputsWithLabels[line];

    if(instr.includes(":")) {
      if(!labelSet.has(instr)) {
        labels[instr.split(":")[0]] = line;
        labelSet.add(instr);
      }
      if(inputsWithLabels[line].split(":")[1].trim() != "") {
        inputsWithLabels[line] = inputsWithLabels[line].split(":")[1].trim();
      } else {
        inputsWithLabels.splice(line, 1); 
      }
    }
  }

  return inputsWithLabels;
}

function inputToComponents(input) {
  if(typeof input === "string") {
    if ((input.substring(0, 2) == 'lw' || input.substring(0, 2) == 'sw') && input.includes('(')) {
      let imm = 0;
      let immInd = 0;
      let variable = "";
      let insideBrack = false;
      let firstComma = -1;
      for(let i = 0; i < input.length; i++) {
        if(input[i] == ')') {
          insideBrack = false;
        }
        if(insideBrack) {
          variable += input[i];
        }
        if(input[i] == '(') {
          imm = input[i - 1];
          immInd = i - 1;
          insideBrack = true;
        }
        
      }
      input = input.substring(0, immInd).trim() + " " + variable + ", " + imm;
      console.log(input);
    }

    return input.replaceAll(',', ', ')
                .split(" ")
                .map(component => component.split(",")[0])
                .filter(component => component.trim() != "");
  }
}


// MIPS SIMULATOR IMPLEMENTATION
function addPreProcVars() {
  if(preProcDir != -1) {
    let currMem = 0;

    preProcDir.split('\n')
              .filter(x => x != '.data' && x.trim() != '')
              .map(instr => {
                //LvRa : Lv denotes variable name defined on left and Ra refers to the assignment to that variable coming in from the right
                let LvRa = instr.split(':')
                let varName = LvRa[0].trim();
                //Lt because type defined on left e.g .word 
                let LtRa = LvRa[1].trim().replace(' ', 'pleaseDontHaveThisInYourInstruction@monkey123').split('pleaseDontHaveThisInYourInstruction@monkey123');
                let type = LtRa[0].trim();
                let assignment = LtRa[1].trim();
                
                labelSet.add(varName);
                labels[varName] = `.ML${currMem}`; 

                if (type == '.word') {
                  let arr = assignment.split(',');
                  let arrLen = arr.length;
                  arrayDict[varName] = [currMem, arr.length];
                  if(arrLen == 1) {
                     varValueDict[varName] = Number(assignment);
                  } else {
                    varValueDict[varName] = `.ML${currMem}`;
                    for (val of arr) {
                      memorySim[currMem] = Number(val.trim());
                      currMem++;
                    }
                    console.log(memorySim);
                  }

                  if(!(temp.hasOwnProperty(varName))) {
                    temp[varName] = 'undef';
                  }
                }
              })
    console.log("EFEFEFEFEFEFEFES@!", currMem);
    currMem = 0;
  }
}

function addVars() {

  processedInstructions.forEach(instr => {
    let len = instr.length;
    if (Jset.has(instr[0])) {
      return;
    } else if (Rset.has(instr[0])) {
      for(let i = 1; i < len; i++) {
        if (instr[i][0] == '$' && instr[i][1] != '0') {
          varValueDict[instr[i]] = 0;
          if(!(temp.hasOwnProperty(instr[i]))) {
            temp[instr[i]] = 'undef';
          }
        }
      }
    } else if (Iset.has(instr[0])) {
      for(let i = 1; i < len; i++) {
        if (instr[i][0] == '$' && instr[i][1] != '0') {
          varValueDict[instr[i]] = 0;
          if(!(temp.hasOwnProperty(instr[i]))) {
            temp[instr[i]] = 'undef';
          }
        }
      }
    } else {
      console.log("Error at line 103");
    }
  });
}

// @param instr: an array of instr components
function execute_instruction(instr) {
  let codeName = instr[0];
  if (Rset.has(codeName)) {
    console.log(`instr: ${currInstr} - R-type instr`);
    (RtypeDict[codeName])(instr);
  } else if (Iset.has(codeName)) {
    console.log(`instr: ${currInstr} - I-type instr`);
    (ItypeDict[codeName])(instr);
  } else if (Jset.has(codeName)) {
    console.log(`instr: ${currInstr} - J-type instr`);
    (JtypeDict[codeName])(instr);
  } else {
    console.log(`instr: ${currInstr} - Invalid/Unsupported instruction`);
  }
}

// R-TYPE INSTRUCTIONS

RtypeDict = {"add" : add, "and" : and, "nor" : nor, "or" : or, "slt" : slt, "sll" : sll, "srl" : srl, "sub" : sub}; 

function add(instr) {
  let rd = instr[1];
  let rs = instr[2];
  let rt = instr[3];

  if (typeof varValueDict[rs] == 'string' && typeof varValueDict[rt] == 'string') {
    console.log('add instr - both are strings');
    return;
  }
  
  if (typeof varValueDict[rs] == 'string' && varValueDict[rs].substring(0, 3) == '.ML') {
    varValueDict[rd] = `.ML${Number(varValueDict[rs].substring(3)) + varValueDict[rt] / 4}`
  } else if (typeof varValueDict[rt] == 'string' && varValueDict[rt].substring(0, 3) == '.ML') {
    varValueDict[rd] = `.ML${Number(varValueDict[rt].substring(3)) + varValueDict[rs] / 4}`
  } else {
    varValueDict[rd] = varValueDict[rs] + varValueDict[rt];
  }

}

function and(instr) {
  let rd = instr[1];
  let rs = instr[2];
  let rt = instr[3];
  varValueDict[rd] = varValueDict[rs] & varValueDict[rt];
}

function nor(instr) {
  let rd = instr[1];
  let rs = instr[2];
  let rt = instr[3];
  varValueDict[rd] = ~(varValueDict[rs] | varValueDict[rt]);
}

function or(instr) {
  let rd = instr[1];
  let rs = instr[2];
  let rt = instr[3];
  varValueDict[rd] = varValueDict[rs] | varValueDict[rt];
}

function slt(instr) {
  let rd = instr[1];
  let rs = instr[2];
  let rt = instr[3];
  if(varValueDict[rs] < varValueDict[rt]) {
    varValueDict[rd] = 1;
  } else {
    varValueDict[rd] = 0;
  }
}

function sll(instr) {
  let rd = instr[1];
  let rt = instr[2];
  let shamt = instr[3];
  varValueDict[rd] = varValueDict[rt] << Number(shamt);
}

function srl(instr) {
  let rd = instr[1];
  let rt = instr[2];
  let shamt = instr[3];
  varValueDict[rd] = varValueDict[rt] >> Number(shamt);
}

function sub(instr) {
  let rd = instr[1];
  let rs = instr[2];
  let rt = instr[3];

  if (typeof varValueDict[rs] == 'string' && typeof varValueDict[rt] == 'string') {
    console.log('sub instr - both are strings');
    return;
  }
  
  if (typeof varValueDict[rs] == 'string' && varValueDict[rs].substring(0, 3) == '.ML') {
    varValueDict[rd] = `.ML${Number(varValueDict[rs].substring(3)) - varValueDict[rt] / 4}`
  } else if (typeof varValueDict[rt] == 'string' && varValueDict[rt].substring(0, 3) == '.ML') {
    varValueDict[rd] = `.ML${varValueDict[rs] / 4 - Number(varValueDict[rt].substring(3))}`
  } else {
    varValueDict[rd] = varValueDict[rs] - varValueDict[rt];
  }
}

// I-TYPE INSTRUCTIONS

ItypeDict = {'addi': addi, 'andi': andi, 'beq': beq, 'bne': bne, 'lui': lui, 'lw': lw, 'ori': ori, 'slti': slti, 'sw': sw};

function addi(instr) {
  let rt = instr[1];
  let rs = instr[2];
  let immd = Number(instr[3]);

  if(typeof varValueDict[rs] == 'number') {
    varValueDict[rt] = varValueDict[rs] + immd;
  } else if (typeof varValueDict[rs] == 'string' && varValueDict[rs].substring(0, 3) == '.ML') {
    varValueDict[rt] = `.ML${Number(varValueDict[rs].substr(3)) + immd / 4}`;
  } else {
    console.log('line 421 ERROR');
  }

}

function andi(instr) {
  let rt = instr[1];
  let rs = instr[2];
  let immd = Number(instr[3]);

  varValueDict[rt] = varValueDict[rs] & immd;
}

function beq(instr) {
  let rt = instr[1];
  let rs = instr[2];
  let instrToJumpTo = Number(labels[instr[3]]);
  if(varValueDict[rt] == varValueDict[rs]) {
    currInstr = instrToJumpTo - 1;
  }
}

function bne(instr) {
  let rt = instr[1];
  let rs = instr[2];
  let instrToJumpTo = Number(labels[instr[3]]);

  if(varValueDict[rt] != varValueDict[rs]) {
    currInstr = instrToJumpTo;
  }
}

function lui(instr) {
  let rt = instr[1];
  let immd = Number(instr[2]);

  varValueDict[rt] = immd & 4294901760;
}

function lw(instr) {
  console.log(varValueDict, currInstr);
  if(instr.length == 4) {
    let rt = instr[1];
    let rs = instr[2];
    let immd = Number(instr[3]);
    console.log(varValueDict[rs]);
    varValueDict[rt] = memorySim[Number(varValueDict[rs].slice(3).trim()) + immd / 4];
  } else {
    let rt = instr[1];
    let label = instr[2];
    varValueDict[rt] = varValueDict[label];
    console.log(varValueDict);
  }
}

function ori(instr) {
  let rt = instr[1];
  let rs = instr[2];
  let immd = Number(instr[3]);

  varValueDict[rt] = varValueDict[rs] | immd;
}

function slti(instr) {
  let rt = instr[1];
  let rs = instr[2];
  let immd = Number(instr[3]);
  
  if (varValueDict[rs] < immd) {
    varValueDict[rt] = 1;
  } else {
    varValueDict[rt] = 0;
  }
}

function sw(instr) {

  if(instr.length == 4) {
    let rt = instr[1];
    let rs = instr[2];
    let immd = Number(instr[3]);
    memorySim[(Number(varValueDict[rs].slice(3)) + immd / 4)] = varValueDict[rt];
  } else {
    let rt = instr[1];
    let label = instr[2];
    varValueDict[rt] = varValueDict[label];
    console.log(varValueDict);
  }
}

// J-TYPE INSTRUCTIONS

JtypeDict = {'j' : j};

function j(instr) {
  let instrToJumpTo = Number(labels[instr[1]]);
  currInstr = instrToJumpTo - 1;
}

// START OF PIPELINING PROCESS

class InstrNode {
  InstrNode(instrNum, edges=[]) {
    this.instrNum = instrNum;
    this.edges = edges;
    this.delay = 0;
  }

  addEdge(edge) {
    this.edges.push(edge);
  }

  setDelay(delay) {
    this.delay = delay;
  }
}

class Edge {
  Edge(fromNode, toNode) {
    this.fromNode = fromNode;
    this.toNode = toNode;
  }
}

let instrNodes = {};

function startPipeline() {
  let instrSeqSet = new Set();
  let instrSeqNoDupe = [];
  instrSeq.forEach(instr => {
                    if(instrSeqSet.has(instr)) {
                      return;
                    }
                    instrSeqSet.add(instr);
                    instrSeqNoDupe.push(instr);
                  })
  generateNodes(instrSeqNoDupe);
}

function generateNodes(instrArr) {
  for(instr of instrArr) {
    let instrNode = new InstrNode(instr);
    instrNodes[instr] = instrNode;
  }
  addDependencies();
}

function addDependencies() {
  console.log(instrNodes);
  let instrNums = Object.keys(instrNodes);
  let len = instrNums.length;

  for(let i = 0; i < len; i++) {
    for(let j = i + 1; j < i + 3 && j < len; j++) {
      if(hasDependency(processedInstructions[instrNums[j]],
                       processedInstructions[instrNums[i]])) {
        console.log(processedInstructions[instrNums[i]], 
                    processedInstructions[instrNums[j]]);
        
        let currDelay = instrNodes[instrNums[j]].delay;
        instrNodes[instrNums[j]].setDelay(Math.min(currDelay, ))

      }
    }
  }
}

function hasDependency(nextInstr, currInstr) {
  let nextInstrLen = nextInstr.length;
  let currInstrLen = currInstr.length;
  return nextInstr.slice(2,nextInstrLen + 1).includes(currInstr[1]);
}