function Game(squareSide, cx){
	this.squareSide=squareSide;
	this.numOfSquareRow=10;
	this.cx=cx;
	this.gap=4;
}
Game.prototype.start=function(){
	this.stillSquares=[];//save the squares that are already still on the triangle.
	this.score=0;
	this.displayScore();
	this.initBestStorage();
	this.bestScore=localStorage.getItem("t_best")||0;
	this.displayBest();
	this.fallingInterval=1000; 
	this.prepareTriangle();
	this.prepareLine();
	this.designNextBlock();
	this.prepareBlocks();
	this.giveBlockHint();
	this.onKeyboard();
	this.onTouchScreen();
	
	window.focus();
};
Game.prototype.prepareTriangle=function(){
	var triSide=this.squareSide*this.numOfSquareRow+this.gap*(this.numOfSquareRow+1);
	var r=Math.sqrt(3)/3*triSide;
	this.triangle=new Triangle(Math.PI/2, r, "gray", this.cx);
	this.triangle.display();
};
Game.prototype.prepareLine=function(){
	var triSide=this.squareSide*this.numOfSquareRow+this.gap*(this.numOfSquareRow+1);
	var r2center=triSide/(Math.sqrt(3)*2)+5*this.squareSide+4*this.gap+10.2;
	this.line=new Line(triSide, r2center, "gray", this.cx);
	this.line.display();
};
Game.prototype.prepareBlocks=function(){
	var block=new Block(this.nextBlockType, this.squareSide, this.gap, cx);
	this.makeBlockFall(block);
};
Game.prototype.makeBlockFall=function(block){
	// block.still=false;
	// console.log(this.stillSquares.length);
	var interval;
	var step=this.squareSide+this.gap;
	var self=this;
	self.fallingBlock=block;
	var hitted=false;
	interval=setInterval(function(){
		var coorRecord=new Vector(block.topleft.x, block.topleft.y);		
		block.disappear();
		block.topleft.y+=step;
		block.setSquareCoors();
		hitted=self.hitTest(block);
		if(hitted){
			block.topleft.x=coorRecord.x;
			block.topleft.y=coorRecord.y;
			block.setSquareCoors();
		}
		block.display();	
		if(hitted){
			clearInterval(interval);
			// block.still=true;
			for(var k in block.squares){
			  self.stillSquares.push(block.squares[k]);
			}
			if(!self.checkIfLose()){
				self.checkIfShouldClear();
				self.newBlock();
				self.giveBlockHint();
			}
			
		}
					
	},	self.fallingInterval);
	self.line.display();
};
Game.prototype.deformBlock=function(block){
	block.disappear();
	var patternRecord=block.pattern;
	for(var i=0;i<block.patterns.length;i++){
		if(block.pattern==block.patterns[i]){
		  block.pattern=block.patterns[i+1]?block.patterns[i+1]:block.patterns[0];
		  break;
		}
	}
	block.setSquareCoors();
	if(block.topleft.x+block.width>=100){ //避免有些情况下右侧的方块不能变形
		block.topleft.x=100-block.width;
		block.setSquareCoors();
	}
	if(this.hitTest(block)){
		block.pattern=patternRecord;
		block.setSquareCoors();
	}
	block.display();
};
Game.prototype.newBlock=function(){
	var block=new Block(this.nextBlockType, this.squareSide, this.gap, cx);
	this.makeBlockFall(block);
};
Game.prototype.moveBlock=function(block, direction){
	/*if(block.still)
    	return;*/
  	block.disappear();
	var coorRecord=new Vector(block.topleft.x, block.topleft.y);
	var step=this.squareSide+this.gap;
	switch(direction){
		case "left":
			block.topleft.x-=step;
			break;
		case "right":
			block.topleft.x+=step;
			break;
		case "down":
			block.topleft.y+=step;
			break;
	}
	block.setSquareCoors();
	if(this.hitTest(block)){
		block.topleft.x=coorRecord.x;
		block.topleft.y=coorRecord.y;
		block.setSquareCoors();
	}
	block.display();
	this.line.display();
};
Game.prototype.rotateSquare=function(s_square, angle){
	var step;
	var absAng1=0.08, absAng2;
	var anglePassed=0;
	var requestID;
	var self=this;
	function animate(){
		s_square.disappear(); 
		absAng2=Math.abs(angle-anglePassed);
		step=angle>0?Math.min(absAng1,absAng2):-Math.min(absAng1,absAng2);
		for(var i=0;i<4;i++){
		  s_square.thetas[i]+=step;
		}
		s_square.rotateApexes();
		s_square.display();
		anglePassed+=step;
		if(anglePassed==angle){
		  	cancelAnimationFrame(requestID);
			if(self.hitTest(self.fallingBlock)){
				self.fallingBlock.disappear();
				self.fallingBlock.topleft.y-=(self.fallingBlock.height+self.gap);
				self.fallingBlock.setSquareCoors();
				self.fallingBlock.display();
				for(var k in self.stillSquares){
					self.stillSquares[k].display();
				}
			}
		}else{
		  	requestID=requestAnimationFrame(animate);
		}
	}
	requestID=requestAnimationFrame(animate);
};
Game.prototype.rotate=function(angle){
	this.triangle.rotate(angle);
	for(var k in this.stillSquares){
		//this.stillSquares[k].rotate(angle);
		this.rotateSquare(this.stillSquares[k], angle);
	}
	this.stillSquares.forEach(function(s_s){
		s_s.display();
	});
};
Game.prototype.onKeyboard=function(){
	var self=this;
	addEventListener("keyup", function(e){
		if(self.canRotate(self.fallingBlock)){
			switch(e.keyCode){
				case 65:
					self.rotate(Math.PI*2/3);
					break;
				case 68:
					self.rotate(-Math.PI*2/3);
					break;
			}
		}
	});
	addEventListener("keydown",function(e){
		switch(e.keyCode){
		  case 38:
		    e.preventDefault();
		    self.deformBlock(self.fallingBlock);
		    break;
		  case 37:
		    e.preventDefault();
		    self.moveBlock(self.fallingBlock, "left");
		    break;
		  case 39:
		    e.preventDefault();
		    self.moveBlock(self.fallingBlock, "right");
		    break;
		  case 40:
		    e.preventDefault();
		    self.moveBlock(self.fallingBlock, "down");
		    break;
		}
	});

};
Game.prototype.onTouchScreen=function(){
	var self=this;
	var canvas=self.cx.canvas;
	var startTouch;
	canvas.addEventListener('touchstart', function(e){
		e.preventDefault();
		startTouch=e.changedTouches[0];
	});
	canvas.addEventListener('touchmove', function(e){
		var currentTouch=e.changedTouches[0];
		var touchType=judgeTouchType(startTouch, currentTouch, self.squareSide);
		if(touchType=='up'){
			self.deformBlock(self.fallingBlock);
			startTouch=currentTouch;
		}else if(touchType=='left'){
			self.moveBlock(self.fallingBlock, 'left');
			startTouch=currentTouch;
		}else if(touchType=='right'){
			self.moveBlock(self.fallingBlock, 'right');
			startTouch=currentTouch;
		}else if(touchType=='down'){
			self.moveBlock(self.fallingBlock, 'down');
			startTouch=currentTouch;
		}
		
	});
	var shunBtn=document.querySelector('#shun');
	var niBtn=document.querySelector('#ni');
	shunBtn.addEventListener('touchstart', function(e){
		e.preventDefault();
		if(self.canRotate(self.fallingBlock)){
			self.rotate(Math.PI*2/3);
		}
	});
	niBtn.addEventListener('touchstart', function(e){
		e.preventDefault();
		if(self.canRotate(self.fallingBlock)){
			self.rotate(-Math.PI*2/3);
		}
	})
};
Game.prototype.hitTest=function(block, lastCoor){
	var distance;
	for(var k in block.squares){
		var fallingX=block.squares[k].topleft.x;
		var fallingY=block.squares[k].topleft.y;
		for(var i=0; i<this.stillSquares.length; i++){
			var stillX=this.stillSquares[i].topleft.x;
			var stillY=this.stillSquares[i].topleft.y;
			distance=Math.sqrt((fallingX-stillX)*(fallingX-stillX)+
							    (fallingY-stillY)*(fallingY-stillY));
			if(distance<0.1){
				return true;
			}
		}

	}
	var triSide=this.squareSide*this.numOfSquareRow+this.gap*(this.numOfSquareRow+1);
	var yLimit=-triSide/(2*Math.sqrt(3))-3;
	// console.log(yLimit);
	if(block.topleft.y+block.height>yLimit){
		// console.log('block.topleft.y+block.height', block.topleft.y+block.height);
		return true;
	}
	if(block.topleft.x<-triSide/2||block.topleft.x+block.width>triSide/2)
		return true;
	return false;
};
Game.prototype.canRotate=function(f_block){
	if(f_block.topleft.y>=-this.line.r2center){
		return false;
	}
	return true;
};
Game.prototype.checkIfShouldClear=function(){
	var ys=[];
	var linesClearedNum=0;//消除的行数越多，加的分数越多。
	var scoreAddition=0;
	var step=this.squareSide+this.gap;
	var self=this;
	for(var i=0; i<this.stillSquares.length; i++){
		ys.push(this.stillSquares[i].topleft.y);
	}
	var triSide=this.squareSide*this.numOfSquareRow+this.gap*(this.numOfSquareRow+1);
	for(var y=minFromAry(ys); y<-triSide/(Math.sqrt(3)*2); y+=step){
		var numAtSameY=0;
		for(var k in this.stillSquares){
			if(areSimilar(y, this.stillSquares[k].topleft.y))
				numAtSameY++;
		}
		if(numAtSameY==10){
			var numOfDeleted=0;
			while(numOfDeleted<10){
				for(var i=0; i<self.stillSquares.length; i++){
					if(numOfDeleted>=10) break;
					var stillSquare=self.stillSquares[i];
					if(areSimilar(stillSquare.topleft.y, y)){
						stillSquare.disappear();
						self.stillSquares.splice(i, 1);
						numOfDeleted++;
					}
				}
			}
			// console.log("numOfDeleted: ", numOfDeleted);
			for(var yy=y-step; yy>=minFromAry(ys); yy-=step){//因为下降会用到disappear方法，所以需要逐层下降
				for(var i=0; i<self.stillSquares.length; i++){
					if(areSimilar(yy, self.stillSquares[i].topleft.y)){
						self.stillSquares[i].disappear();
						self.stillSquares[i].topleft.y+=step;
						self.stillSquares[i].moveApexes();
						self.stillSquares[i].display();
					}
				}
			}
			linesClearedNum++;
			scoreAddition+=linesClearedNum*10;
			
			if(self.fallingInterval>400)
				self.fallingInterval-=20;
		}
	}
	if(scoreAddition>0){
		self.displayScoreAddition(scoreAddition);
		self.score+=scoreAddition;
		self.displayScore();
		self.handleBestStorage();
		self.displayBest();
	}

};
Game.prototype.checkIfLose=function(){
	var triSide=this.squareSide*this.numOfSquareRow+this.gap*(this.numOfSquareRow+1);
	var loseEdge=-triSide/(Math.sqrt(3)*2)-10*this.squareSide-9*this.gap;
	var minStillY=0;
	for(var k in this.stillSquares){
		minStillY=this.stillSquares[k].topleft.y<minStillY?
					this.stillSquares[k].topleft.y:
					minStillY;
	}

	if(minStillY<loseEdge){
		this.afterLosing();
		return true;
	}
};
Game.prototype.designNextBlock=function(){
	var blockTypes=["I", "J", "L", "O", "S", "Z", "T"];
	this.nextBlockType=blockTypes[Math.floor(Math.random()*7)];
};
Game.prototype.giveBlockHint=function(){
	this.designNextBlock();
	if(this.hintBlock)
		this.hintBlock.disappear();	
	this.hintBlock=new Block(this.nextBlockType, this.squareSide, this.gap, this.cx);
	this.hintBlock.topleft.x=-this.hintBlock.width/2;
	this.hintBlock.topleft.y=-this.squareSide*2;
	this.hintBlock.setSquareCoors();
	this.hintBlock.display();
};
Game.prototype.displayScoreAddition=function(addition){
	var additionEle=document.querySelector("#score_addition");
	var color;
	switch(addition){
		case 10:
			color="gray"; break;
		case 30:
			color="olive"; break;
		case 60:
			color="orange"; break;
		case 100:
			color="gold"; break;
	}
	additionEle.style.color=color;
	additionEle.innerText="+"+addition;
	$(additionEle).show();
	$(additionEle).hide(2000);
};
Game.prototype.displayScore=function(){	
	var scoreArea=document.querySelector("#score");
	scoreArea.innerText=this.score;	
};
Game.prototype.initBestStorage=function(){
	if(window.localStorage){
		if(localStorage.getItem("t_best")==null)
			localStorage.setItem("t_best", 0);
	}
};
Game.prototype.handleBestStorage=function(){
	if(localStorage.getItem("t_best")){
		if(this.score>parseInt(localStorage.getItem("t_best"))){
			localStorage.setItem("t_best", this.score);
		}
	}
	this.bestScore=localStorage.getItem("t_best");
}
Game.prototype.displayBest=function(){
	var bestArea=document.querySelector("#best");
	bestArea.innerText="BEST: "+ this.bestScore;
};
Game.prototype.afterLosing=function(){
	var loseInterface=document.querySelector("#lose");
	loseInterface.style.display="block";
};



