// let equationStr;
let equation = [];
let xCoefficient = 0;
let steps = [];

let regexFullEquation = /[+-]?(([0-9]+|x)[+-])*([0-9]+|x)=[+-]?(([0-9]+|x)[+-])*([0-9]+|x)/;
let regexEquationElements = /[0-9]+|[+\-=]|x/g;

class Node {
    constructor(op, a, b) {
        this.op = op;
        this.a = a;
        this.b = b;
    }
}

function submit() {
    let stepsContainer = document.getElementById('stepsContainer');
    stepsContainer.innerHTML = '';
    equation.length = 0;
    xCoefficient = 0;
    steps.length = 0;
    let equationStr = removeSpaces(document.getElementById('equation').value);

    if (verifyEquation(equationStr)) {
        equation = equationStr.match(regexEquationElements);
        removeUnnecessaryPlusSign();
        steps.push(formatStep());

        calculateXC();
        steps.push(formatStep());
        //
        // let thirdStep = passElementsToSecondMember();
        // let fourthStep = new Node('-', new Node('-', new Node('+', 4, 3), 5), 9);
        // let fifthStep = solveOperationsTree(fourthStep);
        // // console.log('res', fifthStep);
        //
        // // console.log('ss', steps);
        steps.forEach((step) => {
            stepsContainer.innerHTML += '<div class=\"step\">' + step + '</div>';
        });

        //teste de criação de arvore
        //createTree("+6263+598/9-864-3*89989*7/2999", 0, new Node(0, null, null))
    } else {
        stepsContainer.innerHTML = 'Expressão inválida';
    }
}

function verifyEquation(eqStr) {
    return eqStr !== '' && eqStr.replace(regexFullEquation, '') === '';
}

function removeSpaces(str) {
    return str.replace(/ /g, '');
}

function removeUnnecessaryPlusSign() {
    let sepIdx = equation.findIndex((el) => el === '=');
    if (equation[0] === '+') {
        equation.splice(0, 1);
    }
    if (equation[sepIdx + 1] === '+') {
        equation.splice(sepIdx + 1, 1);
    }
}

function arrayToString(array) {
    let str = '';

    for (let i = 0; i < array.length; i++) {
        str += array[i];
    }

    return str;
}

function formatStep() {
    let sepIdx = equation.findIndex((el) => el === '=');
    let step = '';

    for (let i = 0; i < equation.length; i++) {
        let currMemBegin = i < sepIdx ? 0 : sepIdx + 1;

        if (i > 0 && !(i === currMemBegin + 1 && equation[currMemBegin] === '-')) {
            step += ' ';
        }

        step += equation[i];
    }

    return step;
}

function passElementsToSecondMember() {
    let frstMember = equationStr.split('=')[0];
    let scndMember = equationStr.split('=')[1];
    let swapMember = '';

    let auxNum = '';
    for (let i = frstMember.length - 1; i >= 0; i--) {
        let intOrNan = Number(frstMember[i]);

        if (!isNaN(intOrNan)) {
            auxNum = intOrNan + auxNum;

            if (i === 0) {
                swapMember = '-' + Number(auxNum) + swapMember;
                auxNum = '';
            }
        } else {
            let op = frstMember[i];

            auxNum = (op === '+' ? -1 : 1) * Number(auxNum);
            swapMember = (op === '+' ? '' : '+') + auxNum + swapMember;
            auxNum = '';
        }
    }
    // console.log('scndMember', scndMember + swapMember);
    return scndMember + swapMember;
}

function solveOperationsTree(node) {
    if (isLeaf(node)) {
        return node;
    }

    let res;
    switch (node.op) {
        case '+':
            res = solveOperationsTree(node.a) + solveOperationsTree(node.b);
            break;
        case '-':
            res = solveOperationsTree(node.a) - solveOperationsTree(node.b);
            break;
    }

    return res;
}

function isLeaf(node) {
    return node.a === undefined && node.b === undefined;
}

//Função que ira calcular o xCoefficient
function calculateXC(){
    let sepIdx = equation.findIndex((el) => el === '=');
    let eqWithoutX = [];

    for (let i = 0; i < equation.length; i++) {
        if (equation[i] === 'x') {
            if (i < sepIdx) {
                if (i === 0) {
                    xCoefficient++;
                } else if (equation[i - 1] === '+') {
                    xCoefficient++;
                    eqWithoutX.pop();
                } else {
                    eqWithoutX.pop();
                    xCoefficient--;
                }
            } else {
                if (i === sepIdx + 1 ) {
                    xCoefficient--;
                } else if (equation[i - 1] === '+') {
                    xCoefficient--;
                    eqWithoutX.pop();
                } else {
                    eqWithoutX.pop();
                    xCoefficient++;
                }
            }
        } else {
            eqWithoutX.push(equation[i]);
            console.log(eqWithoutX);
        }
    }

    equation = [xCoefficient + 'x'].concat(eqWithoutX);
}

//FUNÇÃO QUE CALCULA O COEF EM CADA MEMEBRO
//VERSAO APENAS + E -
function calculateMember(str){
    let i, coef = 0
    for (i=0; i<str.length; i++){
        if(str[i] == 'x'){
            if(str[i-1] == '-')
                coef--
            else
                coef++
        }
            
    }
    return coef
}

function calculateMember2(str) {
    let coef = 0, l = [], c = "", frst = [], scnd = [];
    for (let i = 0; i < str.length; i++) {
        if (str[i] === '+' || (str[i] === '-' && i !== 0)){
            l[l.length] = c;
            c = "";
        }
        c += str[i]
            
    }
    l[l.length] = c
    
    for(let i=0; i<l.length; i++){
        if(l[i].includes("x")){
            // console.log(l[i] + " -> tem um x")
            frst[frst.length] = l[i].replace(/x/g, "1")
        }else{
            scnd[scnd.length] = l[i]
            //l[i] = "1"
        }
    }

    // console.log("f -> " + frst.join(''))
    // console.log("s -> " + scnd)
    //createTree2(frst.join().replace(/,/g, ''), 0, new Node(1, null, null))
    //console.log(createTree2(frst.join().replace(/,/g, ''), 0, new Node(1, null, null)))
    return coef
}


//FUNÇÃO QUE CRIA A ÁRVORE DE OPERAÇÕES
//PARÂMETROS: string das operações, posição atual, no anteriormente criado
//RETORNO: node do topo da arvore
//Na primeira chamada passar: (string, 0, new Node(0, null, null))
function createTree(str, position, ant){
    //condição de parada da recursão
    if(position >= str.length)
        return ant
    //acrescendo 1 pois sempre chega apontando pra um caracter de op
    i = position+1
    //retirando os valores da string
    number = ""
    while(str[i] != '+' && str[i] != '-' && str[i] != '*' && str[i] != '/' && i<str.length){
        number += str[i]
        i++
    }
    //criando node de operação passando: (valor, node anterior, node com o valor numerico)
    nodeOp = new Node(str[position], ant, new Node(Number.parseInt(number), null, null))
    return createTree(str, i, nodeOp)
}

//Função que divide o valor pelo xCoefficient - se é que isso é msm necessario
//recebe o valor retornado pela operação na arvore e divide pelo coeficiente
function finalResult(secondMember){
    return secondMember/xCoefficient
}

/**
 * 
 * 
 * 
 * -1*1-7*2/3*1
 * -5.6
 * 
 * 
 * 
 */

