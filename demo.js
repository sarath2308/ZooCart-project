
var plusOne = function(nums) {
    let str=nums.reduce((acc,val)=>
    {
      return acc+val.toString();
    },'')
    console.log(str);
    
   
    let num=Number(str)
    console.log(num);
    
    let final=num.toString().split('').map(Number)
  
    console.log(final);
    return final
    

    
};  
plusOne([6,1,4,5,3,9,0,1,9,5,1,8,6,7,0,5,5,4,3])