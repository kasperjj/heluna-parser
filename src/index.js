/*
	This is a simple recursive descent parser handwritten to be easily
	portable across languages and platforms.

	The following crude grammar describes the basic syntax being parsed.

    Literal =            <Integer> | <Float> | <String> | <Boolean>
    Boolean =            <Identifier "true"> | <Identifier "false"> 
    Factor = 			 <Literal> | <Reference>
    Term = 				<Factor> (('*' | '/' | '%') <Term>)?
    Reference =			'$' (<Integer> | <Identifier>) <ListAccessor>?
    ListAccessor =		'.' (<Integer> | <String> | <Identifier> | <Reference>) <ListAccessor>?
    Expression = 		 '-'? <Term> (('+' | '-') <Expression>)*
 */

const {tokenizeString,TokenType,ParseException} = require('heluna-tokenizer');

// The different AST nodes that can be returned from the parser
let ExpressionType={
	VALUE:Symbol(),
	OPERATOR:Symbol(),
	FUNCTION:Symbol(),
	IDENTIFIER:Symbol(),
	BOOLEAN:Symbol(),
	LIST:Symbol(),
	EVALUATE:Symbol(),
	LABEL:Symbol(),
	REFERENCE:Symbol(),
	FUNCTION_DEFINITION:Symbol(),
	IF:Symbol(),
	ACCESS:Symbol(),
	FOR:Symbol(),
	WITH:Symbol(),
    NOTHING:Symbol()
}

class Expression{
    constructor(type,token){
        this.type=type
        this.token=token
        this.left=null
        this.right=null
    }
}

/* Literal =            <Integer> | <Float> | <String> | <Boolean>
   Boolean =            <Identifier "true"> | <Identifier "false"> */
function parseLiteral(list){
    var tkn=list.next()
    if(tkn.type==TokenType.INTEGER || tkn.type==TokenType.FLOAT || tkn.type==TokenType.STRING){
        return new Expression(ExpressionType.VALUE,tkn);
    }
    if(tkn.type==TokenType.IDENTIFIER ){
        if(tkn.data==="true" || tkn.data==="false")return new Expression(ExpressionType.VALUE,tkn);
    }
    list.returnToken()
    return null
}

/* Term = 				<Factor> (('*' | '/' | '%') <Term>)? */
function parseTerm(list){
    // Must start with a factor
    var left=parseFactor(list)
    if(left===null)return null

    var position=list.getPosition()
    // Can be followed by * / or % and another term
    var tkn=list.next()
    if(tkn!=null && (tkn.data==="*" || tkn.data==="/" || tkn.data==="%")){
        // Must end with another term
		var right=parseTerm(list)
		if(right==null)throw new ParseException(tkn,"Parser","Isolated operator found at the end");
		var expr=new Expression(ExpressionType.OPERATOR,tkn);
		expr.left=left
        expr.right=right
		return expr
	}

    // This did not end with another term, reset and return initial factor
    list.setPosition(position)
    return left
}

/**
	Attempts to parse a list accessor. If successful, the given expression will
	be wrapped in the list accessor and returned.
    
   ListAccessor =		'.' (<Integer> | <String> | <Identifier> | <Reference>) <ListAccessor>?*/
function attachAccessor(list,expr){
        if(!list.hasNext())return expr
        var tkn=list.next()
        // A list accessor must start with a .
        if(tkn.type!=TokenType.SYMBOL || tkn.data!="."){
            list.returnToken()
            return expr
        }
        var a=new Expression(ExpressionType.ACCESS,tkn)
        a.left=expr
        var value=list.requireNext("List accessor missing value");
        if(value.type==TokenType.INTEGER || value.type==TokenType.STRING){
            a.right=new Expression(ExpressionType.VALUE,value)
            return attachAccessor(list,a)
        }
		if(value.type==TokenType.IDENTIFIER){
            a.right=new Expression(ExpressionType.IDENTIFIER,value)
            return attachAccessor(list,a)
        }
        if(value.type==TokenType.REFERENCE){
            a.right=new Expression(ExpressionType.REFERENCE,value)
            return attachAccessor(list,a)
        }
		throw new ParseException("Invalid list accessor","Parser",value);
	}

/* Reference =			'$' (<Integer> | <Identifier>) <ListAccessor>? */
function parseReference(list){
    if(!list.hasNext())return null
    var tkn=list.next()
    if(tkn.type==TokenType.REFERENCE){
        var expr=new Expression(ExpressionType.REFERENCE,tkn)
        return attachAccessor(list,expr)
    }
    list.returnToken()
    return null
}

/* Factor = 			 <Literal> | <Reference> */
function parseFactor(list){
    if(!list.hasNext())return null
    // <Literal>
    var expr=parseLiteral(list);
    if(expr!=null)return expr;

    // Reference
    expr=parseReference(list);
    if(expr!=null)return expr;

    return null;
}

/* Expression = 		 '-'? <Term> (('+' | '-') <Expression>)* */
function parseExpression(list){
    if(!list.hasNext())return null
    
    var tkn=list.next()
    var wrap=null
    if(tkn.type==TokenType.SYMBOL && tkn.data=="-"){
        wrap=new Expression(ExpressionType.OPERATOR,tkn)
        if(!list.hasNext())throw new ParseException(tkn,"Parser","- is not a valid expression")
    }else{
        list.returnToken()
    }

    var expr=parseTerm(list)
    // TODO: fix error handling here to make it clear what's wrong
    if(expr==null)throw new ParseException(null,"Parser","Expecting a valid Term to start expression")


    // Parse chaining of terms
    while(list.hasNext()){
        tkn=list.next()
        if(tkn.type==TokenType.SYMBOL && (tkn.data=="-" || tkn.data=="+")){
            var chain=parseExpression(list)
            if(chain==null)throw new ParseException(tkn,"Parser","Expecting expression")
            var tmp=new Expression(ExpressionType.OPERATOR,tkn)
            tmp.left=expr
            tmp.right=chain
            expr=tmp
        }else{
            list.returnToken()
            break
        }
    }

    // Apply negation wrapper if needed
    if(wrap!=null){
        wrap.right=expr
        expr=wrap
    }
    return expr
}

function parseTokenList(list){
    if(!list.hasNext())throw new ParseException(null,"Parser","Can not parse a string with no code")
    var expr=parseExpression(list)
    if(expr===null){
        throw new ParseException(null,"Parser","Heluna code must start with a valid expression")
    }
    return expr
}

function parseString(str){
    var list=tokenizeString(str)
    return parseTokenList(list)
}

module.exports = {parseString,ExpressionType};