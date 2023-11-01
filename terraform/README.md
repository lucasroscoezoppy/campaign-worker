# Infrastructure

Nossa infraestrutura é provisionada e gerenciada com Terraform, ferramenta de IaC (Infrastructure as Code) da Hashicorp.

Referencias:

- [What is Terraform](https://developer.hashicorp.com/terraform/intro)
- [Get Started - AWS](https://developer.hashicorp.com/terraform/tutorials/aws-get-started?utm_source=WEBSITE&utm_medium=WEB_IO&utm_offer=ARTICLE_PAGE&utm_content=DOCS)
- [Terraform CLI](https://developer.hashicorp.com/terraform/cli)

```bash
docker run -it --entrypoint='' --mount type=bind,src=${PWD},target=/terraform -w /terraform --rm --env-file=.env hashicorp/terraform:1.5.2 sh
```

## Executando Terraform em ambiente local utilizando Docker

#### fmt

```bash
docker run -it --mount type=bind,src=${PWD},target=/terraform -w /terraform --rm --env-file=.env hashicorp/terraform:1.5.2 -chdir=/terraform/required fmt
```

```bash
docker run -it --mount type=bind,src=${PWD},target=/terraform -w /terraform --rm --env-file=.env hashicorp/terraform:1.5.2 -chdir=/terraform/infra fmt
```

#### init

```bash
docker run -it --mount type=bind,src=${PWD},target=/terraform -w /terraform --rm --env-file=.env hashicorp/terraform:1.5.2 -chdir=/terraform/required init
```

```bash
docker run -it --mount type=bind,src=${PWD},target=/terraform -w /terraform --rm --env-file=.env hashicorp/terraform:1.5.2 -chdir=/terraform/infra init
```

#### validate

```bash
docker run -it --mount type=bind,src=${PWD},target=/terraform -w /terraform --rm --env-file=.env hashicorp/terraform:1.5.2 -chdir=/terraform/required validate
```

```bash
docker run -it --mount type=bind,src=${PWD},target=/terraform -w /terraform --rm --env-file=.env hashicorp/terraform:1.5.2 -chdir=/terraform/infra validate
```

#### plan

```bash
docker run -it --mount type=bind,src=${PWD},target=/terraform -w /terraform --rm --env-file=.env hashicorp/terraform:1.5.2 -chdir=/terraform/required plan -out tfplan
```

```bash
docker run -it --mount type=bind,src=${PWD},target=/terraform -w /terraform --rm --env-file=.env hashicorp/terraform:1.5.2 -chdir=/terraform/infra plan -out tfplan
```

#### apply

```bash
docker run -it --mount type=bind,src=${PWD},target=/terraform -w /terraform --rm --env-file=.env hashicorp/terraform:1.5.2 -chdir=/terraform/required apply "tfplan"
```

```bash
docker run -it --mount type=bind,src=${PWD},target=/terraform -w /terraform --rm --env-file=.env hashicorp/terraform:1.5.2 -chdir=/terraform/infra apply "tfplan"
```

#### destroy

```bash
docker run -it --mount type=bind,src=${PWD},target=/terraform -w /terraform --rm --env-file=.env hashicorp/terraform:1.5.2 -chdir=/terraform/required destroy -auto-approve
```

```bash
docker run -it --mount type=bind,src=${PWD},target=/terraform -w /terraform --rm --env-file=.env hashicorp/terraform:1.5.2 -chdir=/terraform/infra destroy -auto-approve
```
