exports.jsonHash = {
  template:"#jsonHash",
  props:["value","jsonKey","root","path"],
  components:exports,
  data(){
    
    return {
      open:true
    }
  },
  methods:{
    getType(s){
      if(typeof(s)=="string"||typeof(s)=="number"){
        return "value"
      }
      if(s instanceof Array){
        return "list"
      }
      return "hash"
      
    },
    reloadJson(path,val){
      let v=this.value
      for(let i=path.length-1;i>=1;i--){
        v=v[path[i]]
      }
      Vue.set(v,path[0],val)
    }
  }
}
exports.jsonValue = {
  template:'#jsonValue',
  props:["value","jsonKey"],
  components:exports
}
exports.jsonList = {
  template:'#jsonList',
  props:["value","jsonKey"],
  components:exports,
  data(){
    return {
      open:true
    }
  },
  methods:{
    getType(s){
      if(typeof(s)=="string"||typeof(s)=="number"){
        return "value"
      }else if(s instanceof Array){
        return "list"
      }else{
        return "hash"
      }
    }
  }
}
exports.jsonAdd={
  template:'#jsonAdd',
  props:[],
  components:exports,
  data(){
    return {
      open:false,
      key:"",
      value:""
    }
  },
  methods:{
    notifyAdd(){
      let lastObject=this
      let path=[]
      while(lastObject.$options.propsData.root!="true"){//string
        if(lastObject.$options.propsData.jsonKey){
          path.unshift(lastObject.$options.propsData.jsonKey)
        }
        lastObject=lastObject.$parent
      }
      path.unshift(this.key)
      lastObject.reloadJson(path,this.value)
    }
  }
}
exports.closable={
  template:'#closable',
  props:[],
  components:exports,
  data(){
    return {
      open:true
    }
  }
}
