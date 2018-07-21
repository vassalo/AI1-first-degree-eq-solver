let equation = [];
let xCoefficient = 0;
let steps = [];

let regexFullEquation = /[+\-]?([0-9]+x?|x)([+\-\/*](-?([0-9]+x?|x)))*=[+\-]?([0-9]+x?|x)([+\-\/*](-?([0-9]+x?|x)))*/;
let regexEquationElements = /([0-9]*x)|[0-9]+|[+\-\/*=]/g;

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
        updateEquation(equationStr.match(regexEquationElements), true);

        calculateXC();

        if (xCoefficient === 0) {
            stepsContainer.innerHTML = 'Impossível dividir por zero';
            return;
        }

        passElementsToSecondMember();

        // let sepIdx = equation.findIndex((el) => el === '=');
        let operationsTree = createTree(2, equation.length - 1);
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

function parseElementsToNumber(eq = equation) {
    for (let i = 0; i < eq.length; i++) {
        if (!isNaN(eq[i])) {
            eq[i] = Number(eq[i]);
        }
    }
}

function removeSpaces(str) {
    str = str.toLowerCase();
    return str.replace(/ /g, '');
}

function removeUnnecessaryPlusSign(eq = equation) {
    let sepIdx = eq.findIndex((el) => el === '=');
    if (eq[0] === '+') {
        eq.splice(0, 1);
        sepIdx--;
    }
    if (eq[sepIdx + 1] === '+') {
        eq.splice(sepIdx + 1, 1);
    }
}

function identifyUnaryMinus(eq = equation) {
    let sepIdx = eq.findIndex((el) => el === '=');
    let newEquation = [];
    for (let i = eq.length - 1; i >= 0; i--) {
        let beginMember = i < sepIdx ? 0 : sepIdx + 1;

        if (eq[i] === '-') {
            if (i === beginMember || !(!isNaN(eq[i - 1]) || eq[i - 1].match('x'))) {
                const element = newEquation.pop();
                newEquation.push(isNaN(element) ? '-' + element : -1*element);
            } else {
                newEquation.push('-');
            }
        } else {
            newEquation.push(eq[i]);
        }
    }

    return newEquation.reverse()
}

function formatStep() {
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
            let innerCoef = equation[i].match(/[0-9]+/);
            console.log(equation[i], innerCoef);
            let multFactor = (innerCoef === null || innerCoef[0].length === 0 ? 1 : Number(innerCoef[0]));
            if (equation[i][0] === '-') {
                multFactor *= -1;
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

    sepIdx = eqWithoutX.findIndex((el) => el === '=');
    if (sepIdx === eqWithoutX.length - 1) {
        eqWithoutX = eqWithoutX.concat(0);
    }

    updateEquation([(Math.abs(xCoefficient) === 1 ? (xCoefficient < 0 ? '-' : '') : xCoefficient) + 'x'].concat(eqWithoutX));
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

function updateEquation(newEq, parseElements) {
    let update = false;

    removeUnnecessaryPlusSign(newEq);
    newEq = identifyUnaryMinus(newEq);

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
        if (parseElements === true) {
            parseElementsToNumber();
        }

        steps.push(formatStep());
    }
}