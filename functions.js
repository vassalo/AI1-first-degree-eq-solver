let steps = [];
let stepsContainer;

const regexFullEquation = /[+\-]?([0-9]+(\.[0-9]+)?x?|x)([+\-\/*](-?([0-9]+(\.[0-9]+)?x?|x)))*=[+\-]?([0-9]+(\.[0-9]+)?x?|x)([+\-\/*](-?([0-9]+(\.[0-9]+)?x?|x)))*/;
const regexEquationElements = /([0-9]+\.[0-9]+x?)|([0-9]*x)|[0-9]+|[+\-\/*=]/g;

class Node {
    constructor(op, a, b) {
        this.op = op;
        this.a = a;
        this.b = b;
    }
}

/**
 * @param equationStr qualquer equação de entrada
 * @param isRoot deve ser true caso tenha igualdade (dois membros)
 * @returns {string} no formato ax + b (= cx + d [caso isRoot seja true])
 */
function submit(equationStr = removeSpaces(document.getElementById('equation').value), isRoot = true) {
    let memberStr = isRoot ? equationStr.split('=') : [equationStr];  // sempre terá 2 elementos/membros (se for root) ou 1 elemento/membro
    let equation = [];

    if (isRoot) {
        stepsContainer = document.getElementById('stepsContainer');
        stepsContainer.innerHTML = '';

        if (equationStr.match(/=/g) === null) {
            setErrorMessage('Para ser uma equação é necessário haver uma igualdade');
        } else if (equationStr.match(/x/g) === null) {
            setErrorMessage('Para ser do primeiro grau é necessário haver uma incógnita x');
        } else if (!isValidEquation(equationStr)) {
            setErrorMessage('Equação inválida');
        }

        if (hasError()) {
            return undefined;
        }
    }

    let canUpdate = false;
    for (let i = 0; i < memberStr.length; i++) {
        equation.push(separateXCoefficients(memberStr[i]));

        let res = updateEquation(equation[i], equation[i].match(regexEquationElements), true);
        equation[i] = res[0];
        canUpdate = canUpdate || res[1];
    }
    if (canUpdate && isRoot) {
        steps.push(formatStep(equation[0].concat('=', equation[1])));
    }

    canUpdate = false;
    for (let i = 0; i < equation.length; i++) {
        let res = solveMultsAndDivs(equation[i]);
        equation[i] = res[0];
        canUpdate = canUpdate || res[1];
    }
    if (canUpdate && isRoot) {
        steps.push(formatStep(equation[0].concat('=', equation[1])));
    }
    // if (hasError()) {
    //     return false;
    // }
    //
    //
    //
    // calculateXC();
    //
    // if (xCoefficient === 0) {
    //     setErrorMessage('Impossível dividir por zero');
    //     return;
    // }
    //
    // passElementsToSecondMember();
    //
    // // let sepIdx = equation.findIndex((el) => el === '=');
    // let operationsTree = createTree(2, equation.length - 1);
    // // console.log(operationsTree);
    // let result = solveOperationsTree(operationsTree);
    // updateEquation([equation[0], '='].concat(result));
    //
    // updateEquation(['x', '=', finalResult()]);
    //

    if (isRoot) {
        steps.forEach((step) => {
            stepsContainer.innerHTML += '<div class=\"step\">' + step + '</div>';
        });
    }
}

function setErrorMessage(error) {
    stepsContainer.innerHTML = error;
}

function hasError() {
    return stepsContainer.innerHTML !== '';
}

function removeSpaces(str) {
    str = str.toLowerCase();
    return str.replace(/ /g, '');
}

function isValidEquation(eqStr) {
    return eqStr !== '' && eqStr.replace(regexFullEquation, '') === '';
}

/**
 * Encontra elementos/multiplicações do tipo 'Ax', onde A é um númerico, e substitui por 'A*x' (inclui o símbolo de multiplicação)
 * @param eqStr qualquer equação (com 1 ou 2 membros)
 * @returns {string} equação atualizada com as multiplicações do tipo 'A*x' explícitadas
 */
function separateXCoefficients(eqStr) {
    const elementsWithX = eqStr.match(/[0-9]+(\.[0-9]+)?x/g);
    for (let i = 0; i < elementsWithX.length; i++) {
        const separated = elementsWithX[i].substr(0, elementsWithX[i].length - 1).concat('*x');
        eqStr = eqStr.replace(elementsWithX[i], separated);
    }
    return eqStr;
}

/**
 * Atualiza a equação atual para a nova, caso sejam diferentes
 * @param currEq array de elementos da equação atual
 * @param newEq array de elementos da equação nova
 * @param parseElements se for true os valores númericos em string serão convertidos para number
 * @returns {(string|boolean)[]} array de elementos equação atual atualizada, ou não
 */
function updateEquation(currEq, newEq, parseElements) {
    let update = false;

    removeUnnecessaryPlusSign(newEq);
    newEq = identifyUnaryMinus(newEq);

    if (newEq.length > 0 && newEq.length !== currEq.length) {
        update = true;
    } else {
        for (let i = 0; i < currEq.length; i++) {
            if (currEq[i] !== newEq[i]) {
                update = true;
            }
        }
    }

    if (update) {
        currEq = newEq;
        if (parseElements) {
            parseElementsToNumber(currEq);
        }
    }

    return [currEq, update];
}

function removeUnnecessaryPlusSign(eq) {
    if (eq[0] === '+') {
        eq.splice(0, 1);
    }
}

/**
 * Identifica as ocorrências do operador unário negativo e transforma cada uma em um único elemento junto com seu operando
 * @param eq array de elementos da equação
 * @returns {string[]} array de elementos da equação atualizada
 */
function identifyUnaryMinus(eq) {
    // let sepIdx = eq.findIndex((el) => el === '=');
    let newEquation = [];
    for (let i = eq.length - 1; i >= 0; i--) {
        // let beginMember = (!isRoot || i < sepIdx) ? 0 : sepIdx + 1;

        if (eq[i] === '-') {
            if (i === 0 || (isNaN(eq[i - 1]) && !eq[i - 1].match('x'))) {
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

/**
 * Itera pelo array de elementos da equação e converte os números em string para number
 * @param eq array de elementos da equação
 */
function parseElementsToNumber(eq) {
    for (let i = 0; i < eq.length; i++) {
        if (!isNaN(eq[i])) {
            eq[i] = Number(eq[i]);
        }
    }
}

function formatStep(eq, separateElements = true) {
    let step = '';

    for (let i = 0; i < eq.length; i++) {
        if (i > 0 && separateElements) {
            step += ' ';
        }

        step += eq[i];
    }

    return step;
}

/**
 *
 * @param equation
 * @returns {(string|boolean)[]}
 */
function solveMultsAndDivs(equation) {
    let newEqStr = formatStep(equation, false);

    let operations = newEqStr.match(/-?(([0-9]+(\.[0-9]+)?x?)|x)([*\/]-?(([0-9]+(\.[0-9]+)?x?)|x))+/g);
    let solutions = [];
    if(operations === null)
        return [equation, false];

    for (let i = 0; i < operations.length; i++) {
        let currOperation = operations[i];

        if (currOperation.match(/x\*.*\*x|x\*x/)) {
            setErrorMessage('Esta equação não é de primeiro grau.');
            return [equation, false];
        }

        const hasX = currOperation.match('x') !== null;
        if (hasX) {
            const idx = currOperation.indexOf('x');
            if (idx === 0 || currOperation[idx - 1] === '*') {
                currOperation = currOperation.replace('x', '1');
            } else if (currOperation[idx - 1] === '/') {
                setErrorMessage('Impossível dividir número por X.')
                return [equation, false];
            } else {
                currOperation = currOperation.replace('x', '');
            }
        }

        let elements = currOperation.match(/(-?[0-9]+(\.[0-9]+)?)|[*\/]/g);

        let stack = [elements[0]];
        let operator;

        for (let j = 0; j < elements.length; j++) {
            if (!isNaN(elements[j])) {
                elements[j] = Number(elements[j]);

                if (operator === '*') {
                    let prevEl = stack.pop();
                    stack.push(prevEl * elements[j]);
                } else if (operator === '/') {
                    let prevEl = stack.pop();
                    stack.push(prevEl / elements[j]);
                }
            } else {
                operator = elements[j];
            }
        }

        if (hasX) {
            stack[0] += 'x';
        }

        newEqStr = newEqStr.replace(operations[i], stack[0]);
    }

    return updateEquation(newEqStr.match(regexEquationElements), true);
}
//
// function calculateXC(){
//     console.log(equation);
//     let sepIdx = equation.findIndex((el) => el === '=');
//     let eqWithoutX = [];
//
//     for (let i = 0; i < equation.length; i++) {
//         if (isNaN(equation[i]) && equation[i].match('x')) {
//             let innerCoef = equation[i].match(/[0-9]+(\.[0-9]+)?/);
//             let multFactor = (innerCoef === null || innerCoef[0].length === 0 ? 1 : Number(innerCoef[0]));
//             if (equation[i][0] === '-') {
//                 multFactor *= -1;
//             }
//
//             if (i < sepIdx) {
//                 if (i === 0) {
//                     xCoefficient += multFactor;
//                 } else if (equation[i - 1] === '+') {
//                     xCoefficient += multFactor;
//                     eqWithoutX.pop();
//                 } else {
//                     eqWithoutX.pop();
//                     xCoefficient -= multFactor;
//                 }
//             } else {
//                 if (i === sepIdx + 1 ) {
//                     xCoefficient -= multFactor;
//                 } else if (equation[i - 1] === '+') {
//                     xCoefficient -= multFactor;
//                     eqWithoutX.pop();
//                 } else {
//                     eqWithoutX.pop();
//                     xCoefficient += multFactor;
//                 }
//             }
//         } else {
//             eqWithoutX.push(equation[i]);
//         }
//     }
//
//     if (!isNaN(eqWithoutX[0])) {
//         eqWithoutX = ['+'].concat(eqWithoutX);
//     }
//
//     sepIdx = eqWithoutX.findIndex((el) => el === '=');
//     if (sepIdx === eqWithoutX.length - 1) {
//         eqWithoutX = eqWithoutX.concat(0);
//     }
//
//     updateEquation([(Math.abs(xCoefficient) === 1 ? (xCoefficient < 0 ? '-' : '') : xCoefficient) + 'x'].concat(eqWithoutX));
// }
//
// function passElementsToSecondMember() {
//     let sepIdx = equation.findIndex((el) => el === '=');
//     let newScndMember = equation.slice(sepIdx + 1);
//
//     for (let i = 1; i < sepIdx; i++) {
//         switch (equation[i]) {
//             case '+':
//                 newScndMember.push('-');
//                 break;
//             case '-':
//                 newScndMember.push('+');
//                 break;
//             default:
//                 newScndMember.push(equation[i]);
//                 break;
//         }
//     }
//
//     updateEquation([equation[0], '='].concat(newScndMember));
// }
//
// function createTree(begin, end){
//     if (begin === end) {
//         return equation[begin];
//     }
//
//     let a, b, op;
//     for(let i = end; i >= begin; i--) {
//         if (isNaN(equation[i])) {
//             op = equation[i];
//             a = createTree(begin, i - 1);
//             b = createTree(i + 1, end);
//             return new Node(op, a, b);
//         }
//     }
// }
//
// function solveOperationsTree(node) {
//     if (isLeaf(node)) {
//         return node;
//     }
//
//     let res;
//     switch (node.op) {
//         case '+':
//             res = solveOperationsTree(node.a) + solveOperationsTree(node.b);
//             break;
//         case '-':
//             res = solveOperationsTree(node.a) - solveOperationsTree(node.b);
//             break;
//     }
//
//     return res;
// }
//
// function isLeaf(node) {
//     return node.a === undefined && node.b === undefined;
// }
//
// function finalResult(){
//     return equation[2]/xCoefficient;
// }
//
