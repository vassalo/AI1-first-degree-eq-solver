var equationStr;
var xCoefficient;
var steps = [];

class Node {
    constructor(op, a, b) {
        this.op = op;
        this.a = a;
        this.b = b;
    }
}

function submit() {
    steps.length = 0;

    var stepsContainer = document.getElementById('stepsContainer');
    stepsContainer.innerHTML = '';

    removeSpaces();
    steps.push(prepareStep(equationStr));

    var thirdStep = passElementsToSecondMember();
    var fourthStep = new Node('-', new Node('-', new Node('+', 4, 3), 5), 9);
    var fifthStep = solveOperationsTree(fourthStep);
    console.log('res', fifthStep);

    console.log('ss', steps);
    steps.forEach((step) => {
        stepsContainer.innerHTML += '<div class=\"step\">' + step + '</div>';
    });

    xCoefficient = calculateXC()
    
    //teste de criação de arvore
    //createTree("+6263+598/9-864-3*89989*7/2999", 0, new Node(0, null, null))

}

function removeSpaces() {
    equationStr = document.getElementById('equation').value;
    equationStr = equationStr.replace(/ /g, '');
    console.log('eqStr:', equationStr);
}

function prepareStep(eqStr) {
    var elements = eqStr.split(/([+\-=])|([0-9]+)/g);
    var step = '';

    for (var i = 0; i < elements.length; i++) {
        if (elements[i]) {
            if (i > 0) {
                step += ' ';
            }

            step += elements[i];
        }
    }

    return step;
}

function passElementsToSecondMember() {
    var frstMember = equationStr.split('=')[0];
    var scndMember = equationStr.split('=')[1];
    var swapMember = '';

    var auxNum = '';
    for (var i = frstMember.length - 1; i >= 0; i--) {
        var intOrNan = Number(frstMember[i]);

        if (!isNaN(intOrNan)) {
            auxNum = intOrNan + auxNum;

            if (i === 0) {
                swapMember = '-' + Number(auxNum) + swapMember;
                auxNum = '';
            }
        } else {
            var op = frstMember[i];

            auxNum = (op === '+' ? -1 : 1) * Number(auxNum);
            swapMember = (op === '+' ? '' : '+') + auxNum + swapMember;
            auxNum = '';
        }
    }
    console.log('scndMember', scndMember + swapMember);
    return scndMember + swapMember;
}

function solveOperationsTree(node) {
    if (isLeaf(node)) {
        return node;
    }

    var res;
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
    console.log("Equação digitada: " + equationStr)
    //separando em 2 strings
    var strEq = equationStr.split('=')
    calculateMember2(strEq[0])
    calculateMember2(strEq[1])
    return calculateMember(strEq[0]) - calculateMember(strEq[1])

}

//FUNÇÃO QUE CALCULA O COEF EM CADA MEMEBRO
//VERSAO APENAS + E -
function calculateMember(str){
    var i, coef = 0
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

function calculateMember2(str){
    var i, coef = 0, l = [], c = "", frst = [], scnd = []
    for (i=0; i<str.length; i++){
        if(str[i] == '+' || (str[i] == '-' && i!=0)){
            l[l.length] = c
            c = ""
        }
        c += str[i]
            
    }
    l[l.length] = c
    
    for(i=0; i<l.length; i++){
        if(l[i].includes("x")){
            console.log(l[i] + " -> tem um x")
            frst[frst.length] = l[i].replace(/x/g, "1")
        }else{
            scnd[scnd.length] = l[i]
            //l[i] = "1"
        }
    }

    console.log("f -> " + frst.join(''))
    console.log("s -> " + scnd)
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

