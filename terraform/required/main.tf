module "repository" {
  source = "git::https://github.com/Zoppy-crm/tf-ecr-module.git?ref=v1.0"

  # generic
  application = "campaign"
  environment = terraform.workspace
  project     = "worker"
}

output "repo_url" {
  value = module.repository.url
}
