let equation = [];
let xCoefficient = 0;
let steps = [];

let regexFullEquation = /[+-]?(([0-9]+|x)[+\-\/*])*([0-9]+|x)=[+-]?(([0-9]+|x)[+\-\/*])*([0-9]+|x)/;
let regexEquationElements = /[0-9]+|[+\-\/*=]|x/g;
////let regexFullEquation = /[+-]?(([0-9]+|x)[+-])*([0-9]+|x)=[+-]?(([0-9]+|x)[+-])*([0-9]+|x)/;
// let regexFullEquation = /[+-]?(([0-9]+(\.[0-9]+)?|x)[+-])*([0-9]+(\.[0-9]+)?|x)=[+-]?(([0-9]+(\.[0-9]+)?|x)[+-])*([0-9]+(\.[0-9]+)?|x)/;
////let regexEquationElements = /[0-9]+|[+\-=]|x/g;
// let regexEquationElements = /([0-9]+(\.[0-9]+)?)|[+\-=]|x/g;

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
        
        parseElementsToNumber();
        removeUnnecessaryPlusSign();
        steps.push(formatStep());

        calculateXC();

        console.log(equation)
        
        if (xCoefficient === 0) {
            stepsContainer.innerHTML = 'Impossível dividir por zero';
            return;
        }

        passElementsToSecondMember();

        let sepIdx = equation.findIndex((el) => el === '=');
        solvingMultAndDiv(sepIdx+1)

       

        let operationsTree = createTree(sepIdx + 1, equation.length - 1);
        //console.log("tree: " + operationsTree.op);

        //navigateTree(operationsTree)

        let result = solveOperationsTree(operationsTree);
        updateEquation([equation[0], '='].concat(result));

        updateEquation(['x', '=', finalResult()]);

        steps.forEach((step) => {
            stepsContainer.innerHTML += '<div class=\"step\">' + step + '</div>';
        });
    } else {
        stepsContainer.innerHTML = 'Expressão inválida';
    }
}

function verifyEquation(eqStr) {
    return eqStr !== '' && eqStr.replace(regexFullEquation, '') === '';
}

function parseElementsToNumber() {
    for (let i = 0; i < equation.length; i++) {
        if (!isNaN(equation[i])) {
            equation[i] = Number(equation[i]);
        }
    }
}

function removeSpaces(str) {
    return str.replace(/ /g, '');
}

function removeUnnecessaryPlusSign() {
    let sepIdx = equation.findIndex((el) => el === '=');
    if (equation[0] === '+') {
        equation.splice(0, 1);
        sepIdx--;
    }
    if (equation[sepIdx + 1] === '+') {
        equation.splice(sepIdx + 1, 1);
    }
}

function formatStep() {
    // console.log('eq', equation);
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

function coefOfEachX(begin, sinal){
    let i = begin+1
    var coef = 0, coef2 = 0, dps = 1, ants = 1
    
    if(equation[begin+1] !== '*' && equation[begin+1] !== '/'){
        dps = 1
        fim = begin+1
    }else{
        while(equation[i] !== '+' && equation[i] !== '-' && equation[i] !== '=' ){
            if(i === equation.length)
                break
            if(equation[i] === '*'){
                dps = dps * equation[i+1]
            }else {
                dps = dps / equation[i+1]
            }
            coef = dps
            i += 2
        }
        fim = i
    
         if(equation[begin-1] == '-'){
            dps *= -1
        }
    }

    if(equation[begin-1] !== '*' && equation[begin-1] !== '/'){
        ants = 1
    }else{
        i = sinal+1
        coef = 0
        if((sinal === 0 && equation[sinal] === '-' ) || sinal !== 0)
            i++
        
        if(equation[begin-1] !== '=')
            ants = equation[i-1]
        if(begin === 0)
            ants = 1
        

        while(i !== begin-1){
            if(i === equation.length || equation[begin-1] === '=')
                break
            if(equation[i] === '*'){
                ants = ants * equation[i+1]
            }else if(equation[i] === '/'){
                ants = ants / equation[i+1]
            }
            i += 2
            coef = ants
        }

        if(equation[sinal] == '-'){
            ants *= -1
        }
    }

    equation.splice(sinal, fim-sinal)


    console.log("eq splices: " + equation)
    console.log("dps: " + dps + "  ants: " + ants)
    console.log("sinal: " + sinal + "  fim: " + fim)
    //updateEquation(equation)
    return dps * ants
}

function calculateXC(){
    let sepIdx = equation.findIndex((el) => el === '=');
    let eqWithoutX = [], s = 0;

    for (let i = 0; i < equation.length; i++) {
        if(equation[i] === '+' || equation[i] === '-')
            s = i
        if(equation[i] === 'x') {        

            if (i < sepIdx) {
                xCoefficient += coefOfEachX(i, s)
            } else {
                xCoefficient -= coefOfEachX(i, s)
            }

        } else {
            eqWithoutX.push(equation[i]);
        }
    }
    console.log("eq: " + equation)
    console.log("xc: " + xCoefficient)
    equation.unshift(xCoefficient + 'x')
}

function passElementsToSecondMember() {
    let sepIdx = equation.findIndex((el) => el === '=');
    let newScndMember = equation.slice(sepIdx + 1);

console.log("newscndmem: " + newScndMember)

    for (let i = 1; i < sepIdx; i++) {
        switch (equation[i]) {
            case '+':
                newScndMember.push('-');
                break;
            case '-':
                newScndMember.push('+');
                break;
            default:
                newScndMember.push(equation[i]);
                break;
        }
    }

    console.log("newscndmem: " + newScndMember)

    updateEquation([equation[0], '='].concat(newScndMember));
    console.log("equation: " + equation)
}

function createTree(begin, end){
    if (begin === end) {
        return equation[begin];
    }

    let a, b, op;
    for(let i = end; i >= begin; i--) {
        if (isNaN(equation[i]) && typeof equation[i] !== 'object') {
            console.log("entrou com: " + equation[i])
            op = equation[i];
            a = createTree(begin, i - 1);
            b = createTree(i + 1, end);
            return new Node(op, a, b);
        }
    }
}

function navigateTree(node) {
    if (isLeaf(node)) {
        console.log("Folha:" + node)
    }else{
        navigateTree(node.a)
        navigateTree(node.b)
        console.log("Op: " +node.op)
    }
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
        case '*':
            res = solveOperationsTree(node.a) * solveOperationsTree(node.b);7
            break;
        case '/':
            res = solveOperationsTree(node.a) / solveOperationsTree(node.b);
            break;
    }

    console.log(node.a + " " + node.op + " " + node.b + " = " + res);
    return res;
}

function isLeaf(node) {
    return node.a === undefined && node.b === undefined;
}

function finalResult(){
    return equation[2]/xCoefficient;
}

function updateEquation(newEq) {
    let update = false;

    if (newEq.length !== equation.length) {
        update = true;
    } else {
        for (let i = 0; i < equation.length; i++) {
            if (equation[i] !== newEq[i]) {
                update = true;
            }
        }
    }

    if (update) {
        equation = newEq;
        steps.push(formatStep());
    }
}

function solvingMultAndDiv (begin){
    var saida = []
    for (let i = begin; i < equation.length+1; i++){
        if(equation[i] == '*' || equation[i] == '/'){
            n = new Node(equation[i], equation[i-1], equation[i+1])
            console.log("n.a: " + n.a)
            if(typeof saida[saida.length-1] === 'object' ){
                n = new Node(equation[i], saida[saida.length-1], equation[i+1])
                saida.splice(saida.length-1, 1)}
            saida.push(n)
            i++
            continue
        }
        if(equation[i-2] === '*' || equation[i-2] === '/' || equation[i-1]==='=')
            continue
        saida.push(equation[i-1])        
    }
    updateEquation([equation[0], '='].concat(saida));
}