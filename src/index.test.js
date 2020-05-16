const {parseString,ExpressionType} = require('./index');

function compareNodes(node,expr, debug=false){
    // Current node value must match
    if(node.v!==expr.token.data){
        if(debug)console.log("node content doesn't match: node='"+node.v+"' vs expr='"+expr.token.data+"'")
        return false
    }
    if(node.l!=null){
        // If we expect a left value it must be there
        if(expr.left==null){
            return false
        }
        // The left children must match
        if(!compareNodes(node.l,expr.left,debug))return false
    }else{
        // If we don't expect a left value, it must not be there
        if(expr.left!=null)return false
    }
    if(node.r!=null){
        // If we expect a right value it must be there
        if(expr.right==null)return false
        // The right children must match
        if(!compareNodes(node.r,expr.right,debug))return false
    }else{
        // If we don't expect a right value, it must not be there
        if(expr.right!=null)return false
    }
    return true
}

test('Empty string',()=>{
    var str=''
    expect(()=>{parseString(str)}).toThrow()
})

test('Integer literal 42',()=>{
    var str='42'
    expect(()=>{parseString(str)}).not.toThrow()
    var expr=parseString(str)
    expect(compareNodes({v:"42"},expr)).toBeTruthy()
})

test('Floating point literal 3.141592',()=>{
    var str='3.141592'
    expect(()=>{parseString(str)}).not.toThrow()
    var expr=parseString(str)
    expect(compareNodes({v:"3.141592"},expr)).toBeTruthy()
})

test('String literal "Hello World"',()=>{
    var str='"Hello World"'
    expect(()=>{parseString(str)}).not.toThrow()
    var expr=parseString(str)
    expect(compareNodes({v:"Hello World"},expr)).toBeTruthy()
})

test('Unclosed string literal "Hello World',()=>{
    var str='"Hello World'
    expect(()=>{parseString(str)}).toThrow()
})

test('Boolean literal false',()=>{
    var str='false'
    expect(()=>{parseString(str)}).not.toThrow()
    var expr=parseString(str)
    expect(compareNodes({v:"false"},expr)).toBeTruthy()
})

test('Boolean literal true',()=>{
    var str='true'
    expect(()=>{parseString(str)}).not.toThrow()
    var expr=parseString(str)
    expect(compareNodes({v:"true"},expr)).toBeTruthy()
})

test('Simple multiplication 3*7',()=>{
    var str='3*7'
    expect(()=>{parseString(str)}).not.toThrow()
    var expr=parseString(str)
    expect(compareNodes({v:"*",l:{v:"3"},r:{v:"7"}},expr)).toBeTruthy()
})

test('Simple multiplication 4300 * 11',()=>{
    var str='4300 * 11'
    expect(()=>{parseString(str)}).not.toThrow()
    var expr=parseString(str)
    expect(compareNodes({v:"*",l:{v:"4300"},r:{v:"11"}},expr)).toBeTruthy()
})

test('Simple floating point multiplication 6.3 *5',()=>{
    var str='6.3 *5'
    expect(()=>{parseString(str)}).not.toThrow()
    var expr=parseString(str)
    expect(compareNodes({v:"*",l:{v:"6.3"},r:{v:"5"}},expr)).toBeTruthy()
})

test('Simple division 2/ 9',()=>{
    var str='2/ 9'
    expect(()=>{parseString(str)}).not.toThrow()
    var expr=parseString(str)
    expect(compareNodes({v:"/",l:{v:"2"},r:{v:"9"}},expr)).toBeTruthy()
})

test('Simple modulus 2 %9',()=>{
    var str='2 %9'
    expect(()=>{parseString(str)}).not.toThrow()
    var expr=parseString(str)
    expect(compareNodes({v:"%",l:{v:"2"},r:{v:"9"}},expr)).toBeTruthy()
})

test('Missing term 3*',()=>{
    var str='3*'
    expect(()=>{parseString(str)}).toThrow()
})

test('Chained multiplication terms 3 * 11*42',()=>{
    var str='3 * 11*42'
    expect(()=>{parseString(str)}).not.toThrow()
    var expr=parseString(str)
    expect(compareNodes({v:"*",l:{v:"3"},r:{v:"*",l:{v:"11"},r:{v:"42"}}},expr,false)).toBeTruthy()
})

test('Chained multiplication and division terms 5 *11 /9',()=>{
    var str='5 *11 /9'
    expect(()=>{parseString(str)}).not.toThrow()
    var expr=parseString(str)
    expect(compareNodes({v:"*",l:{v:"5"},r:{v:"/",l:{v:"11"},r:{v:"9"}}},expr,false)).toBeTruthy()
})

test('Reference $foo',()=>{
    var str='$foo'
    expect(()=>{parseString(str)}).not.toThrow()
    var expr=parseString(str)
    expect(compareNodes({v:"foo"},expr)).toBeTruthy()
})

test('Simple accessor on reference $foo.9',()=>{
    var str='$foo.9'
    expect(()=>{parseString(str)}).not.toThrow()
    var expr=parseString(str)
    expect(compareNodes({v:".",l:{v:"foo"},r:{v:"9"}},expr)).toBeTruthy()
})

test('String accessor on reference $foo."bar"',()=>{
    var str='$foo."bar"'
    expect(()=>{parseString(str)}).not.toThrow()
    var expr=parseString(str)
    expect(compareNodes({v:".",l:{v:"foo"},r:{v:"bar"}},expr)).toBeTruthy()
})

test('Reference accessor on reference $foo.$bar',()=>{
    var str='$foo.$bar'
    expect(()=>{parseString(str)}).not.toThrow()
    var expr=parseString(str)
    expect(compareNodes({v:".",l:{v:"foo"},r:{v:"bar"}},expr)).toBeTruthy()
})

test('Deep accessor on reference $foo.9.11.4',()=>{
    var str='$foo.9.11.4'
    expect(()=>{parseString(str)}).not.toThrow()
    var expr=parseString(str)
    expect(compareNodes({v:".",l:{v:".",l:{v:".",l:{v:"foo"},r:{v:"9"}},r:{v:"11"}},r:{v:"4"}},expr)).toBeTruthy()
})

test('Simple addition 2+9',()=>{
    var str='2+9'
    expect(()=>{parseString(str)}).not.toThrow()
    var expr=parseString(str)
    expect(compareNodes({v:"+",l:{v:"2"},r:{v:"9"}},expr)).toBeTruthy()
})

test('Simple subtraction 2-9',()=>{
    var str='2-9'
    expect(()=>{parseString(str)}).not.toThrow()
    var expr=parseString(str)
    expect(compareNodes({v:"-",l:{v:"2"},r:{v:"9"}},expr)).toBeTruthy()
})

test('Subtraction with reference $foo-9',()=>{
    var str='$foo-9'
    expect(()=>{parseString(str)}).not.toThrow()
    var expr=parseString(str)
    expect(compareNodes({v:"-",l:{v:"foo"},r:{v:"9"}},expr)).toBeTruthy()
})

test('Subtraction with reference 8-$foo',()=>{
    var str='8-$foo'
    expect(()=>{parseString(str)}).not.toThrow()
    var expr=parseString(str)
    expect(compareNodes({v:"-",l:{v:"8"},r:{v:"foo"}},expr)).toBeTruthy()
})


test('Negation -9',()=>{
    var str='-9'
    expect(()=>{parseString(str)}).not.toThrow()
    var expr=parseString(str)
    expect(compareNodes({v:"-",r:{v:"9"}},expr)).toBeTruthy()
})

test('Addition and multiplication 2+9*4',()=>{
    var str='2+9*4'
    expect(()=>{parseString(str)}).not.toThrow()
    var expr=parseString(str)
    expect(compareNodes({v:"+",l:{v:"2"},r:{v:"*",l:{v:"9"},r:{v:"4"}}},expr)).toBeTruthy()
})