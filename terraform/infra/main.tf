module "main" {
  source = "git::https://github.com/Zoppy-crm/tf-consumer-fargate.git?ref=stable"

  # data
  ecs_cluster_name = terraform.workspace == "master" ? "cluster-zoppy-master" : "cluster-zoppy-dev"

  # generic
  application = "campaign"
  environment = terraform.workspace
  project     = "worker"

  # task definition
  cpu_architecture = "ARM64"
  task_cpu         = terraform.workspace == "master" ? 256 : 256
  task_memory      = terraform.workspace == "master" ? 512 : 512
  task_env_file    = terraform.workspace == "master" ? "arn:aws:s3:::zoppy-environment/zoppy-master/.env" : "arn:aws:s3:::zoppy-environment/zoppy-dev/.env"
  image_url        = var.image_url
  # task_execution_role_inline_policy = "./task_execution_role_inline_policy.json.tftpl"
  # task_role_inline_policy = "./task_role_inline_policy.json.tftpl"
  task_port = 8081

  # service
  desired_count = terraform.workspace == "master" ? 10 : 1
  # vpc_id        = "vpc-0cb9bc93d77344737"
}

variable "image_url" {
  description = "Variavel utilizada para receber o valor da URL da imagem."
  type        = string
}
