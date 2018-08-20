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
    console.log('submit', equationStr);
    let memberStr = isRoot ? equationStr.split('=') : [equationStr];  // sempre terá 2 (se for root) ou 1 membros
    let equation = []; // sempre terá 1 ou 2 array de elementos

    //region Checagem de erros para Root
    if (isRoot) {
        stepsContainer = document.getElementById('stepsContainer');
        stepsContainer.innerHTML = '';
        steps.length = 0;

        if (equationStr.match(/=/g) === null) {
            setErrorMessage('Para ser uma equação é necessário haver uma igualdade');
        } else if (equationStr.match(/x/g) === null) {
            setErrorMessage('Para ser do primeiro grau é necessário haver uma incógnita x');
        } else if (!isValidEquation(equationStr.replace(/\(/g, '').replace(/\)/g    , ''))) {
            setErrorMessage('Equação inválida');
        }

        if (hasError()) {
            return undefined;
        }
    }
    //endregion

    //region Verifica a existência de parênteses e chama recursivamente
    for (let i = 0; i < memberStr.length; i++) {
        if (hasUnbalancedParenthesis(memberStr[i])) {
            setErrorMessage('Equação possui parênteses desbalanceados');
            return undefined;
        } else if (memberStr[i].match(/\(\)/)) {
            setErrorMessage('Equação possui parênteses vazios');
            return undefined;
        }

        let subEquations = memberStr[i].match(/\(.+\)/g);
        for (let j = 0; subEquations && j < subEquations.length; j++) {
            let curr = subEquations[j].substr(1).substr(0, subEquations[j].length - 2);
            curr = submit(curr, false);
            if (curr === undefined) return undefined;
            memberStr[i] = memberStr[i].replace(subEquations[j], curr);
        }
    }
    //endregion

    //region Explicita as multiplações do tipo a*x
    let canUpdate = false;
    for (let i = 0; i < memberStr.length; i++) {
        memberStr[i] = separateXCoefficients(memberStr[i]);
        equation.push([]);

        let res = updateEquation(equation[i], memberStr[i].match(regexEquationElements), true);
        equation[i] = res[0];
        canUpdate = canUpdate || res[1];
    }
    if (canUpdate && isRoot) {
        steps.push(formatStep(equation[0].concat('=', equation[1])));
    }
    //endregion

    //region Resolve as multiplicações e divisões
    canUpdate = false;
    for (let i = 0; i < equation.length; i++) {
        let res = solveMultsAndDivs(equation[i]);
        equation[i] = res[0];
        canUpdate = canUpdate || res[1];
    }
    if (canUpdate && isRoot) {
        steps.push(formatStep(equation[0].concat('=', equation[1])));
    }
    //endregion

    //region Encontra o coeficiente de x em ambos os membros
    canUpdate = false;
    for (let i = 0; i < equation.length; i++) {
        let res = calculateXC(equation[i]);
        equation[i] = res[0];
        canUpdate = canUpdate || res[1];
    }
    if (canUpdate && isRoot) {
        steps.push(formatStep(equation[0].concat('=', equation[1])));
    }
    //endregion

    //region Resolve somas e subtrações
    canUpdate = false;
    for (let i = 0; i < equation.length; i++) {
        let operationsTree = createTree(equation[i], isNaN(equation[i][0]) ? 2 : 0, equation[i].length - 1);
        let operationsResult = operationsTree !== undefined ? solveOperationsTree(operationsTree) : 0;

        let res = updateEquation(equation[i],
            isNaN(equation[i][0]) ?
                equation[i].length > 1 ?
                    [equation[i][0], equation[i][1]].concat(operationsResult)
                    : [equation[i][0]]
                : [operationsResult], false);
        equation[i] = res[0];
        canUpdate = canUpdate || res[1];
    }
    if (canUpdate && isRoot) {
        steps.push(formatStep(equation[0].concat('=', equation[1])));
    }
    //endregion

    //region Calcula o resultado final, jogando cada elemento pro seu respectivo membro
    if (isRoot) {
        let finalXCoef = 0;
        finalXCoef += isNaN(equation[0][0]) ? extractXCoef(equation[0][0]) : 0;
        finalXCoef -= isNaN(equation[1][0]) ? extractXCoef(equation[1][0]) : 0;

        let finalResult = 0;
        finalResult -= equation[0].length > 1 ?
                            equation[0][1] === '+' ? equation[0][2] : -equation[0][2]
                        : isNaN(equation[0][0]) ? 0 : equation[0][0];
        finalResult += equation[1].length > 1 ?
                            equation[1][1] === '+' ? equation[1][2] : -equation[1][2]
                        : isNaN(equation[1][0]) ? 0 : equation[1][0];

        finalResult = finalResult / finalXCoef;

        let res = updateEquation(equation[0], ['x'], false);
        equation[0] = res[0];
        canUpdate = res[1];
        res = updateEquation(equation[1], [finalResult], false);
        equation[1] = res[0];
        canUpdate = canUpdate || res[1];

        if (canUpdate) {
            steps.push(formatStep(equation[0].concat('=', equation[1])));
        }
    }
    //endregion

    if (isRoot) {
        steps.forEach((step) => {
            stepsContainer.innerHTML += '<div class=\"step\">' + step + '</div>';
        });
    } else {
        return formatStep(equation[0], false);
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

function hasUnbalancedParenthesis(eqStr) {
    let stack = [];

    for (let i = 0; i < eqStr.length; i++) {
        if (eqStr[i] === '(') {
            stack.push('(');
        } else if (eqStr[i] === ')') {
            if (stack.length === 0) {
                return true;
            }
            stack.pop();
        }
    }

    return stack.length !== 0;
}

/**
 * Encontra elementos/multiplicações do tipo 'Ax', onde A é um númerico, e substitui por 'A*x' (inclui o símbolo de multiplicação)
 * @param eqStr qualquer equação (com 1 ou 2 membros)
 * @returns {string} equação atualizada com as multiplicações do tipo 'A*x' explicitadas
 */
function separateXCoefficients(eqStr) {
    const elementsWithX = eqStr.match(/[0-9]+(\.[0-9]+)?x/g);
    for (let i = 0; elementsWithX && i < elementsWithX.length; i++) {
        const separated = elementsWithX[i].substr(0, elementsWithX[i].length - 1).concat('*x');
        eqStr = eqStr.replace(elementsWithX[i], separated);
    }
    return eqStr;
}

/**
 * Atualiza o array de elementos da equação atual para o novo, caso sejam diferentes
 * @param currEq array de elementos da equação atual
 * @param newEq array de elementos da equação nova
 * @param parseElements se for true os valores númericos em string serão convertidos para number
 * @returns {(string[]|boolean)[]} tupla com array de elementos da equação atual atualizada, ou não, e uma flag que indica se o array novo é diferente do inicial
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
 * Resolve as multiplicações e divisões de um array de elementos
 * @param equation array de elementos da equação a ser resolvida
 * @returns {(string[]|boolean)[]} tupla com array de elementos com as multiplicações e divisões resolvidas e uma flag que diz se a equação nova é diferente da inicial
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
            return undefined;
        }

        const hasX = currOperation.match('x') !== null;
        if (hasX) {
            const idx = currOperation.indexOf('x');
            if (idx === 0 || currOperation[idx - 1] === '*') {
                currOperation = currOperation.replace('x', '1');
            } else if (currOperation[idx - 1] === '/') {
                setErrorMessage('Impossível dividir número por X.');
                return undefined;
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

    return updateEquation(equation, newEqStr.match(regexEquationElements), true);
}

/**
 * Calcula o coeficiente de X e coloca junto a X
 * @param equation equação a ser simplificada
 * @returns {(string[]|boolean)[]} tupla com array de elementos com os elementos de X simplificados e uma flag que indica se o novo array é diferente do inicial
 */
function calculateXC(equation){
    let eqWithoutX = [], xCoefficient = 0;

    for (let i = 0; i < equation.length; i++) {
        if (isNaN(equation[i]) && equation[i].match('x')) {
            let innerCoef = equation[i].match(/[0-9]+(\.[0-9]+)?/);
            let multFactor = (innerCoef === null || innerCoef[0].length === 0 ? 1 : Number(innerCoef[0]));
            if (equation[i][0] === '-') {
                multFactor *= -1;
            }

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
            eqWithoutX.push(equation[i]);
        }
    }

    if (!isNaN(eqWithoutX[0]) && xCoefficient !== 0) {
        eqWithoutX = ['+'].concat(eqWithoutX);
    }

    return updateEquation(equation,
        xCoefficient !== 0 ? [(Math.abs(xCoefficient) === 1 ? (xCoefficient < 0 ? '-' : '') : xCoefficient) + 'x'].concat(eqWithoutX) : eqWithoutX, false);
}

function createTree(equation, begin, end){
    if (begin === end) {
        return equation[begin];
    }

    let a, b, op;
    for(let i = end; i >= begin; i--) {
        if (isNaN(equation[i])) {
            op = equation[i];
            a = createTree(equation, begin, i - 1);
            b = createTree(equation, i + 1, end);
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

function extractXCoef(element) {
    const multiplyFactor = element[0] === '-' ? -1 : 1;
    const match = (element[0] === '-' ? element.substr(1) : element).match(/[0-9]+(\.[0-9]+)?/);
    if (match === null) {
        return multiplyFactor;
    }
    return Number(match[0]) * multiplyFactor;
}
