var CHIP8 = { 
	
	memory: new UInt8Array(4096),
	V: new UInt8Array(16),
	I: 0,
	pc = 0x200,
	stack: new Array,
	graphics: new Uint8Array(64*32),
	sound_timer: 0,
	delay_timer: 0,
	
};

function int_random_range(upper) {
	return Math.floor(Math.random() * (upper));
}

function main() {
	
	while (true) {
		
		cpu();
		
	}
	
}

function cpu() {
	
	// read next opcode
	var opcode = (CHIP8.memory[CHIP8.pc] << 8) | (CHIP8.memory[CHIP8.pc + 1]);
	
	switch (opcode & 0xF00) { // return the first 4 bits from left
		var address = opcode & 0x0FFF;
		var x = (opcode & 0x0F00) >> 8;
		var y = (opcode & 0x00F0) >> 4;
		var kk = opcode & 0x00FF;
		var n = opcode & 0x000F;
		
		case 0x000: 
			switch (opcode) {
				case 0x00E0:
				//Clears the screen.
					clear_screen();
					break;
				case 0x0E0:
				//Returns from a subroutine.
				//Pop the stack and set the pc to the removed element
					CHIP8.pc = CHIP8.stack.pop();
					break;	
			}
		break;
		
		case 0x1000: 
		//0x1NNN Jumps to NNN address by setting the pc
			CHIP8.pc = address;
			break;
		
		case 0x2000:
		//0x2NNN Calls subrutine at address NNN
		// push the current pc in the stack, then the pc is set to NNN
			CHI8.stack.push(CHIP8.pc);
			CHIP8.pc = address;
			break;
		
		case 0x3000:
		//0x3XKK Skip next instruction if VX = KK
			if (CHIP8.V[x] == kk) {
				CHIP8.pc += 2; // skip the next 2-byte instruction
			}
			break;
		
		case 0x4000:
		//0x4XKK Skips the next instruction if VX != NN	
			if (CHIP8.V[x] != kk) {
				CHIP8.pc += 2; // skip the next 2-byte instruction
			}
			break;
		
		case 0x5000:
		//0x5XY0 Skip next instruction if VX = VY
			if (CHIP8.V[x] == CHIP8.V[y]) {
				CHIP8.pc += 2;
			}
			break;
		
		case 0x6000:
		//0x6XKK Set VX = KK
			CHIP8.V[x] = kk;
			break;
		
		case 0x7000:
		//0x7XKK Set VX = VX + KK
			CHIP8.V[x] += kk;
			break;
		
		case 0x8000:
			switch (opcode & 0x000F) {
				
				case 0:
				//0x8XY0 Set Vx = Vy
					CHIP8.V[x] = CHIP8.V[y];
					break;
				
				case 1:
				//0x8XY0 Set Vx = Vx OR Vy.	
					CHIP8.V[x] |= CHIP8.V[y];
					break;
				
				case 2:
				//0x8XY0 Set Vx = Vx AND Vy
					CHIP8.V[x] &= CHIP8.V[y];
					break;				
				
				case 3:
				//0x8XY0 Set Vx = Vx XOR Vy
					CHIP8.V[x] ^= CHIP8.V[y];
					break;
				
				case 4:
				//0x8XY0 Set Vx = Vx + Vy, set VF = carry.
					var sum = CHIP8.V[x] + CHIP8.V[y];
					
					if (sum > 255) {
						CHIP8.V[0xF] = 0x1; 
					} else {
						CHIP8.V[0xF] = 0x0; 
					}
					
					CHIP8.V[x] = sum;
					break;
				
				case 5:
				//0x8XY0 Set Vx = Vx - Vy, set VF = NOT borrow.
					if (CHIP8.V[x] > CHIP8.V[y]) {
						CHIP8.V[0xF] = 0x1; 
					} else {
						CHIP8.V[0xF] = 0x0; 
					}
					CHIP8.V[x] = CHIP8.V[x] - CHIP8.V[y];
					break;
				
				case 6:
				//0x8XY0 Set Vx = Vx SHR 1.
				// If the least-significant bit of Vx is 1, then VF is set to 1, otherwise 0. Then Vx is divided by 2.
					if (CHIP8.V[x] % 2 == 1) {  //if the LSB is set to 1 the number is odd
						CHIP8.V[0xF] = 0x1;
					} else {
						CHIP8.V[0xF] = 0x0;
					}
					
					CHIP8.V[x] = CHIP8.V[x] >> 1; //divide by 2
					break;
				
				case 7:
				//0x8XY0 Set Vx = Vy - Vx, set VF = NOT borrow
				//If Vy > Vx, then VF is set to 1, otherwise 0. Then Vx is subtracted from Vy, and the results stored in Vx
					if (CHIP8.V[x] < CHIP8.V[y]) {
						CHIP8.V[0xF] = 0x1; 
					} else {
						CHIP8.V[0xF] = 0x0; 
					}
					CHIP8.V[x] = CHIP8.V[y] - CHIP8.V[x]; 
					break;
				
				case 0xE:
				//0x8XYE Set Vx = Vx SHL 1
				//If the most-significant bit of Vx is 1, then VF is set to 1, otherwise to 0. Then Vx is multiplied by 2
					if (CHIP8.V[x] >= 128) {  
						CHIP8.V[0xF] = 0x1; 
					} else {
						CHIP8.V[0xF] = 0x0; 
					}
					CHIP8.V[x] = CHIP8.V[x] << 1; //multiply by 2
					break;
				
			} 
			break;
		
		case 0x9000: 
		//0x9xy0 Skip next instruction if Vx != Vy
			if (CHIP8.V[x] != CHIP8.V[y]) {
				CHIP8.pc += 2;
			}
			break;
		
		case 0xA000:
		//0xAnnn Set I = nnn
			CHIP8.I = address;
			break;
		
		case 0xB000:
		//0xBnnn Jump to location nnn + V0.
			CHIP8.pc = address + CHIP8.V[0];
			break;
		
		case 0xC000:
		//0xBxkk Set Vx = random byte AND kk.
			var rand_byte = int_random_range(255);
			CHIP8.V[x] = rand_byte & kk;
			break;
		
		case 0xD000:
		//0xDxyn Display n-byte sprite starting at memory location I at (Vx, Vy), set VF = collision
			 
			
			break;
			
		case 0xE000:
			switch (opcode & 0x00FF) {
				
				case 0x009E:
				//0xEx9E Skip next instruction if key with the value of Vx is pressed 
					break;
 
				
				
				
			}
			break;
		
	}
	
	CHIP8.pc += 2 // increment pc (every instruction in 2 bytes long) 
	
	
	
}