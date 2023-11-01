import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
	@Get()
	public async listen(): Promise<void> {
		console.log('Listening...')
	}
}
