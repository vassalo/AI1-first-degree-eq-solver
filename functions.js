let equation = [];
let xCoefficient = 0;
let steps = [];

let regexFullEquation = /[+\-]?([0-9]+|x)([+\-\/*](-?([0-9]+|x)))*=[+\-]?([0-9]+|x)([+\-\/*](-?([0-9]+|x)))*/;
// let regexFullEquation = /[+-]?(([0-9]+(\.[0-9]+)?|x)[+-])*([0-9]+(\.[0-9]+)?|x)=[+-]?(([0-9]+(\.[0-9]+)?|x)[+-])*([0-9]+(\.[0-9]+)?|x)/;
let regexEquationElements = /x|[0-9]+|[+\-\/*=]/g;
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
        removeUnnecessaryPlusSign();
        identifyUnaryMinus();
        parseElementsToNumber();
        // console.log(equation);
        steps.push(formatStep());

        calculateXC();

        if (xCoefficient === 0) {
            stepsContainer.innerHTML = 'Impossível dividir por zero';
            return;
        }

        passElementsToSecondMember();

        let sepIdx = equation.findIndex((el) => el === '=');
        let operationsTree = createTree(sepIdx + 1, equation.length - 1);
        // console.log(operationsTree);
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
    str = str.toLowerCase();
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

function identifyUnaryMinus() {
    let sepIdx = equation.findIndex((el) => el === '=');
    let newEquation = [];
    for (let i = equation.length - 1; i >= 0; i--) {
        let beginMember = i < sepIdx ? 0 : sepIdx + 1;

        if (equation[i] === '-') {
            if (i === beginMember || !(!isNaN(equation[i - 1]) || equation[i - 1] === 'x')) {
                const element = newEquation.pop();
                newEquation.push(isNaN(element) ? '-' + element : -1*element);
            } else {
                newEquation.push('-');
            }
        } else {
            newEquation.push(equation[i]);
        }
    }

    equation = newEquation.reverse();
}

function formatStep() {
    let sepIdx = equation.findIndex((el) => el === '=');
    let step = '';

    for (let i = 0; i < equation.length; i++) {
        if (i > 0) {
            step += ' ';
        }

        step += equation[i];
    }

    return step;
}

function calculateXC(){
    let sepIdx = equation.findIndex((el) => el === '=');
    let eqWithoutX = [];

    for (let i = 0; i < equation.length; i++) {
        if (isNaN(equation[i]) && equation[i].match('x')) {
            let multFactor = 1;
            if (equation[i][0] === '-') {
                multFactor = -1;
            }

            if (i < sepIdx) {
                if (i === 0) {
                    xCoefficient += multFactor;
                } else if (equation[i - 1] === '+') {
                    xCoefficient += multFactor;
                    eqWithoutX.pop();
                } else {
                    eqWithoutX.pop();
                    xCoefficient -= multFactor;
                }
            } else {
                if (i === sepIdx + 1 ) {
                    xCoefficient -= multFactor;
                } else if (equation[i - 1] === '+') {
                    xCoefficient -= multFactor;
                    eqWithoutX.pop();
                } else {
                    eqWithoutX.pop();
                    xCoefficient += multFactor;
                }
            }
        } else {
            eqWithoutX.push(equation[i]);
        }
    }

    if (!isNaN(eqWithoutX[0])) {
        eqWithoutX = ['+'].concat(eqWithoutX);
    }

    updateEquation([xCoefficient + 'x'].concat(eqWithoutX));
}

function passElementsToSecondMember() {
    let sepIdx = equation.findIndex((el) => el === '=');
    let newScndMember = equation.slice(sepIdx + 1);

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

    updateEquation([equation[0], '='].concat(newScndMember));
}

function createTree(begin, end){
    if (begin === end) {
        return equation[begin];
    }

    let a, b, op;
    for(let i = end; i >= begin; i--) {
        if (isNaN(equation[i])) {
            op = equation[i];
            a = createTree(begin, i - 1);
            b = createTree(i + 1, end);
            return new Node(op, a, b);
        }
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
    }

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
        removeUnnecessaryPlusSign();
        identifyUnaryMinus();
        steps.push(formatStep());
    }
}