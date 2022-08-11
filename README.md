
# Run Image Optimization

Função serverless que redimensiona a imagem de prefil 
vinda do projeto [Run frontend](https://github.com/JoseMayconHS/run-frontend)



## Funcionalidade

Observa quando alguma imagem é criada em um bucket, redimensiona para 180x180, salva em outro bucket e apaga a imagem original.


## Aprendizados

- Serverless


## Framework

[Serverless Framework](https://www.serverless.com/)


## Variáveis de Ambiente

Para rodar esse projeto, você vai precisar adicionar as seguintes variáveis de ambiente no seu .env

`BUCKET_NAME`

`TO_BUCKET_NAME`

`RESIZE_DIRECTORY`

