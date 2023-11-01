terraform {
  backend "s3" {
    bucket = "zoppy-tfstate"
    key    = "crm/campaign-worker/required.tfstate"
    region = "us-east-1"
  }
}
