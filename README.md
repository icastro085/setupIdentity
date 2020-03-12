##Exemplo de como testar
Os passo abaixo é para ser usado para testar localmente, no final não precisa fazer nada para armazenar no cookie as informações, elas serão feitas o "log" é apenas para mostrar que finalizou, mas todas as informações já estarão no cookie, e caso ja esteja armazenado não fará a request pro server.

##Como importart o script
- Tag HTML

```html
<script charset="UTF-8" async="true" src="https://static.chaordicsystems.com/static/setup-identity.js"></script>
```

- Por javascript
```javascript
!function(){
  var script = 'https://static.chaordicsystems.com/static/setup-identity.js';
  var insertionPoint = document.getElementsByTagName('head')[0];
  var node = document.createElement('script');

  node.setAttribute('charset', 'UTF-8');
  node.setAttribute('async', true);
  node.src = script;

  insertionPoint.insertBefore(node, insertionPoint.firstChild);
}();
```

##Como usar
```javascript
linxImpulseSetupIdentity('centauro-v5', function(identity) {
  console.log(identity);
});
```
##Como fazer deploy local

```bash
$ ./deploy
```
