function raw(str) {
    return '\'' + str + '\'';
}
exports.moduleAlias = function (ast) {
    return {
        type: 'VariableDeclaration',
        declarations: [{
                type: 'VariableDeclarator',
                id: ast.id,
                init: {
                    type: 'CallExpression',
                    callee: {
                        type: 'Identifier',
                        name: 'require',
                        loc: ast.loc
                    },
                    arguments: [ast.source]
                }
            }],
        kind: 'var',
        loc: ast.loc
    };
};