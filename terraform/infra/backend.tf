terraform {
  backend "s3" {
    bucket = "zoppy-tfstate"
    key    = "crm/campaign-worker/infra.tfstate"
    region = "us-east-1"
  }
}
