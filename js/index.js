/*
コードを分割しないのはよろしくないが、
私はEmacs狂信者だが、Vue.jsで推奨される書き方である単一ファイルコンポーネントを、js2-mode,Emmet-mode,scss-mode,Tern auto completeで、立派なシンタックスハイライトをつけて書くという欲張りはできないようだ。
よって、templateをindex.htmlに直書きし、index.jsにコンポーネントを全て書くということになっているが、お許しください。
*/

const cryptico = require("cryptico")
const dataTransporter = [];//use only push() pop() dataTransporter[index]
var customBar = {//for safari
  template:"#customBar",
  props:["pageStack","title"]
}
const TutorialItem = {
  template:"#tutorialItem",
  props:["image","bgColor","textColor"],

}
const Tutorial = {
  template:"#tutorial",  props:["pageStack"],
  data(){
    return {carIndex:0};
  },
  methods:{
    back(){
      this.pageStack.pop();
    }
  },
  components:{tutorialItem:TutorialItem}
}
const Search = {
  template:"#search",  props:["pageStack"],
  data(){
    return {
      result:[],
      searchText:"",
      preservedText:dataTransporter.pop(),
      suggest:[],
      focus:true,
      loading:false,
      showSuggest:true,
      timedout:false
    }
  },
  mounted(){
    if(this.preservedText){
      this.searchText=this.preservedText
      this.search()
    }
  },
  components:{customBar},
  methods:{
    search(){
      this.loading=true;
      this.timedout=false;
      
      manager.search(P2PManager.createSearchCond(this.searchText)).then((res)=>{
        this.result=res.result;
        this.suggest=[]
        this.showSuggest=false
        this.loading=false;
      },()=>{
        this.timedout=true;
      })
    },
    goToContentDetail(cId){
      
      this.pageStack.push(ContentInfo);
      dataTransporter.push(cId)
    }
  },
  watch:{
    searchText(){
      if(this.searchText.length>3 && this.focus){
        this.showSuggest=true;
        setTimeout(()=>{
          this.suggest=["There's no suggestion now.Please continue to type"]
        },600)
      }else{
        this.suggest=[];
      }
    },
    focus(){
      if(!this.focus){
        this.suggest=[];
      }
    }
  }

}
const Collection = {
  template:"#collection",  props:["pageStack"],
  components:{customBar},
  data(){
    return {
      items:[],
      timedout:false
    }
  },
  mounted(){
    setTimeout(this.getCollection,500)
  },
  methods:{
    goToContentDetail(contentId){
      this.pageStack.push(ContentInfo);
      dataTransporter.push(contentId);
    },
    getCollection(){
      this.timedout=false;
      manager.getCollection().then(res=>{
        this.items = res
      },()=>{
        this.timedout=true;
      });
    }
  }
}

const ContentInfo = {
  template:"#contentInfo",  props:["pageStack"],
  components:{customBar},
  data(){
    return {
      contentId:dataTransporter.pop(),
      content:{},
      fullDescription:false,
      minerVisible:false,
      minedSuccessful:false,
      miner:null,
      hashesPerSecond:0,
      totalHashes:0,
      acceptedHashes:0,
      minerKey:"",
      minerObserver:0,
      throttle:60
    }
  },
  methods:{
    getContentData(){
      
      
      manager.seekData(this.contentId).then(res=>{
        this.idList=res.idList
        return manager.sendReceiveChannelMessage(res.idList,{
          verb:"requestContentInfo",
          dataId:this.contentId
        }).then(res=>{
          const result=res.data.result;
          this.content={
            contentId:this.contentId,
            shortName:result.name.substr(0,10),
            name:result.name,
            description:result.description,
            shortDescription:result.description.substr(0,30),
            tag:[],
            requireMining:!!result.requireMining,
            file:{
              downloadable:!!result.downloadable,
              cacheAllowed:true,
              readableInViewer:true,
              bytes:result.dataSize
            },
            uploader:{
              name:result.screenName||false,
              id:result.userId
            },
            user:{
              hasThisItem: false,
              hasDownloaded:false
            }
          };
          JSON.parse(result.tags).forEach(v=>{
            this.content.tag.push({name:v})
          })
          this.requireMining=result.requireMining
          this.minerKey=result.minerKey
        })
      })
    },
    addThisToCollection(){
      if(!this.content||!this.content.contentId){
        return
      }

      if(this.requireMining){
        console.log("Mining requested");
        this.minerVisible=true
        const miner =this.miner= new CoinHive.Anonymous(this.minerKey,{
	        autoThreads: true,
	        throttle: 0.6,
	        language: 'auto'
        });
	      miner.start(); //ask permission

        miner.on("optin",ans=>{
          if(ans.status!=="accepted"){
            this.stopMining()
          }
        });

        this.minerObserver=setInterval(()=>{
		      this.hashesPerSecond = (miner.getHashesPerSecond()+"").slice(0,5);
		      this.totalHashes = miner.getTotalHashes();
		      this.acceptedHashes = miner.getAcceptedHashes();
          if(this.totalHashes>1000||this.acceptedHashes>=1024){
            this.stopMining(true);
          }
	      }, 1000);
        
        miner.on("error",()=>{
          this.$ons.notification.toast("An error occured while mining.",{timeout:3000});
        })
        
      }else{
        this.stopMining(true)
      }
      
    },
    stopMining(succeeded){
      this.miner&&this.miner.stop()
      clearInterval(this.minerObserver)
      this.minerVisible=false;
      if(succeeded===true){
        this.content.user.hasThisItem=true
        manager.addToCollection(this.content.contentId)
      }
    },
    download(){
      if(!this.content||!this.content.contentId||!this.content.user.hasThisItem||!this.content.file.downloadable){
        return
      }
      dataTransporter.push({id:this.content.contentId,name:this.content.shortName,bytes:this.content.file.bytes,idList:this.idList})
      this.pageStack.push(Download)
    },
    searchTag(tag){
      dataTransporter.push("#"+tag)
      this.pageStack.push(Search)
    },
    view(){
      dataTransporter.push({id:this.content.contentId,idList:this.idList})
      this.pageStack.push(Viewer)
    },
    showProfile(id){
      dataTransporter.push(id)
      this.pageStack.push(UserProfile)
    }
  },
  mounted(){
    setTimeout(
    this.getContentData,800);
  },
  watch:{
    throttle(){
      this.miner.setThrottle(1-this.throttle/100)
    }
  },
  computed:{
    description(){
      if(!this.content){
        return ""
      }
      return this.content.description;
    }
  }
}
const Viewer = {
  template:"#viewer",  props:["pageStack"],
  components:{customBar},
  methods:{
    back(){
      this.pageStack.pop()
    }
  },
  data(){
    return {
      ret:dataTransporter.pop()
    };
  },
  mounted(){
    return manager.sendReceiveChannelMessage(this.ret.idList,{
      verb:"requestContentBody",
      dataId:this.ret.id
    }).then(res=>{
      this.$refs.frame.src=res.data.body
    })
  }
}
const ChangeServer = {
  template:"#changeServer",  props:["pageStack"],
  components:{customBar},
  data(){
    return {svr:localStorage.defaultServer}
  },
  methods:{
    apply(){
      if(!this.svr){return;}
      localStorage.defaultServer=this.svr
      window.location.reload()
    }
  }
}
const Download = {
  template:"#download",  props:["pageStack"],
  components:{customBar},
  data(){
    return {
      ret:dataTransporter.pop()
    };
  },
  methods:{
    startDownload(){
      const win = window.open("about:blank")
      return manager.sendReceiveChannelMessage(this.ret.idList,{
        verb:"requestContentBody",
        dataId:this.ret.id
      }).then(res=>{
        win.location.href=res.data.body
      })
    }
  }
}
const Other = {
  template:"#other",  props:["pageStack"],
  components:{customBar},
  methods:{
    goToTutorial(){
      this.pageStack.push(Tutorial);
    },
    regenKey(){
      this.pageStack.push(First)
    },
    changeServer(){
      this.pageStack.push(ChangeServer)
    },
    goToConnectionChart(){
      this.pageStack.push(ConnectionChart)
    }
    
  }
}

const First = {
  template:"#first",  props:["pageStack"],
  components:{customBar},
  methods:{
    goToGenKey(){
      this.pageStack.push(GenerateKey)
    },
    goToUseKey(){
      this.pageStack.push(UseKey)
    }, goToTutorial(){
      this.pageStack.push(Tutorial);
    }
  }
}

// i used English words list instead of Japanese one because of surrogate pair
// 日本語で 保存するなり 秘密鍵 英語に変えさす サロゲートペア

function loadWordList() {
  return new Promise(function(resolve, reject) {
    var xhr = new XMLHttpRequest
    xhr.onload = function() {
      resolve(JSON.parse(xhr.responseText))
    }
    xhr.onerror = function() {
      reject(new TypeError('request failed'))
    }
    xhr.open('GET', "dist/res/bip39en.json")
    xhr.send(null)
  })
}

function indexFromSortedList(sortedArray,value){
  let left=0
  let right=sortedArray.length-1

  while(left<=right){
    const center=(left+((right-left)/2)|0)
    const centerVal=sortedArray[center]
    if(centerVal===value){
      return center
    }else if(centerVal<value){
      left = center+1
    }else{
      right = center-1
    }
    
  }
  return null
}

function arrayToWords(array){
  return loadWordList().then((wordList)=>{
    const words = []
    for(let i=0;i<13;i++){
      words.push(wordList[array[i]]);
    }
    return words
  })
}
function wordsToArray(words){
  return loadWordList().then((wordList)=>{
    const array = []
    for(let i=0;i<13;i++){
      const ret = indexFromSortedList(wordList,words[i])
      if(ret){
        array.push(ret)
      }else{
        return null
      }
    }
    return array;
  })

}

const NoteKey = {
  template:"#noteKey",  props:["pageStack"],
  components:{customBar},
  data(){
    return {
      rsaData:dataTransporter.pop(),
      words:[],
      wordsToShow:""
    }
  },
  methods:{
    done(){
      localStorage.seed=this.rsaData.key.join(",")
      localStorage.privKey=JSON.stringify(this.rsaData.rsa.toJSON())
      localStorage.publicKey=this.rsaData.pubKey
      this.pageStack.push(ChangeServer)
    },
  },
  mounted(){
    arrayToWords(this.rsaData.key).then((words)=>{
      this.wordsToShow=words.join(" ")
    })
  }
}
const ua = navigator.userAgent;
const GenerateKey = {
  template:"#generateKey",  props:["pageStack"],
  components:{customBar},
  data(){
    return {
      cnt:0,
      next:false,
      keyArray:[],
      sensorAvailable:false,
      isPhone:(ua.indexOf("iPad") >= 0 || ua.indexOf("iPhone") >= 0 || ua.indexOf("iPod") >= 0 || ua.indexOf("Android") >= 0 || ua.indexOf("Windows Phone") >= 0)
    }
  },
  methods:{
    complete(){
      if(!this.next){
        this.next=true;
        const rsaKey=P2PManager.generateRSAKeyFromSeed(this.keyArray.join(","))
        dataTransporter.push({
          rsa:rsaKey,
          key:this.keyArray,
          pubKey:cryptico.publicKeyString(rsaKey)
        })
        this.pageStack.push(NoteKey)
      }
    }
  },
  mounted(){//2048 is the number of words in BIP39 word list.13 is word count.
    let detecting = true;
    let drag=false;
    let arr=[];
    const gd = this.$ons.GestureDetector(this.$refs.touchArea)
    gd.on("dragstart",(e)=>{
      if(!detecting){return}
      drag=true;
    })
    gd.on("drag",(e)=>{
      if(!detecting){return}
      if(((Math.random()*19)|0)==4){
        const a=((e.gesture.interimAngle*e.gesture.deltaX*e.gesture.deltaY)|0)%2048;
        if(a){
          arr.push(a>0?a:-a)
        }
      }
    });
    gd.on("dragend",(e)=>{
      if(!detecting){return}
      drag=false;
      if(arr.length){
        let sum=16;
        for(let i=arr.length-1;i>=0;i--){
          sum+=arr[i];
        }
        this.keyArray.push(sum%2048);
        if(++this.cnt>=13){
          detecting = false
          setInterval(()=>{this.complete()},300);
        }
      }
      arr=[];
    })
    window.addEventListener("devicemotion",(e)=>{
      if(!detecting){return}
      if(e.rotationRate.alpha){
        this.sensorAvailable=true
      }

      if(7==((Math.random()*21)|0)){
        let a=((e.acceleration.x+e.acceleration.y+e.rotationRate.alpha+e.rotationRate.beta+e.rotationRate.gamma)*810893)|0;
        a=a>0?a:-a
        if(a>30){
          this.keyArray.push(a%2048)
          if(++this.cnt>=13){
            detecting = false
            setInterval(()=>{this.complete()},300);
          }
        }
      }
    }, true);
  }
}
const UseKey = {
  template:"#useKey",  props:["pageStack"],
  components:{customBar},
  data(){
    return {
      words:"",
      again:false
    }
  },
  methods:{
    next(){
      wordsToArray(this.words.split(" ")).then((arr)=>{
        if(!arr){
          this.again=true
          return
        }
        
        const j =arr.join(",")
        const k=P2PManager.generateRSAKeyFromSeed(j)
        localStorage.seed=j
        localStorage.privKey=JSON.stringify(k)
        localStorage.publicKey=cryptico.publicKeyString(k)
        this.pageStack.push(ChangeServer)
      })
    }
  }
}


const P2PManager=require("../../p2plearn-server")
const manager = window.man= new P2PManager()
const Home = {
  template:"#home",
  props:["pageStack"],
  data(){
    return {
      isWV:false
    }
  },
  methods:{
    goToSearch(){
      this.pageStack.push(Search);
    },
    goToCollection(){
      this.pageStack.push(Collection);
    },
    goToOther(){
      this.pageStack.push(Other);
    },
    goToDetail(contentId){
      dataTransporter.push(contentId);
      this.pageStack.push(ContentInfo);
    },
    goToUpload(){
      this.pageStack.push(UploadFile)
    },
    goToMyProfile(){
      this.pageStack.push(MyProfile)
    },
    goToLearnLang(){
      location.href="/learnlang"
    }
  },
  components:{customBar},
  mounted(){
    if(!localStorage.defaultServer){
      this.pageStack.pop()
      this.pageStack.push(ChangeServer)
      this.$ons.notification.alert("Server is not provided.")
      return 
    }
    
    manager.setKey(localStorage.privKey)
    manager.beginService(localStorage.defaultServer)
    window.addEventListener("load",()=>{
      this.isWV=this.$ons.platform.isWebView()
    })

    
  }
}
const UploadFile={
  template:"#uploadFile",  props:["pageStack"],
  components:{customBar},
  data(){
    return {
      uploadData:{
        description:"",
        tags:[""],
        requireMining:false,
        name:""
      },
      uploading:false
    }
  },
  methods:{
    upload(){
      if(!(this.uploadData.description.length&&this.uploadData.name.length&&this.uploadData.tags[0].length&&this.$refs.file.files&&this.$refs.file.files.length&&!this.uploading)){
        this.$ons.notification.toast("Please fill in name,tag 1,description,file",{timeout:3000});
        return;
      }
      this.uploading=true;
      const reader=new FileReader()
      reader.onload=(e)=>{
        let tags=[]
        this.uploadData.tags.forEach((b)=>{
          b&&tags.push(b)
        })
        
        manager.uploadFile({
          description:this.uploadData.description,
          tags:JSON.stringify(tags),
          requireMining:this.uploadData.requireMining,
          body:e.target.result,
          name:this.uploadData.name
        })
        this.pageStack.pop();
        this.$ons.notification.toast("Uploaded!",{timeout:3000});
      }
      reader.readAsDataURL(this.$refs.file.files[0])
    }
  }
}
const MyProfile={
  template:"#myProfile",  props:["pageStack"],
  components:{customBar},
  data(){
    return {
      screenName:"",
      profile:"",
      myId:localStorage.publicKey,
      miningKey:""
    }
  },
  methods:{
    update(){
      manager.updateUserProfile(this.screenName,this.profile,this.miningKey)
    }
  },
  mounted(){
    manager.seekUser(localStorage.publicKey).then(d=>{
      this.screenName=d.result.screenName
      this.profile=d.result.profile,
      this.miningKey=d.result.minerKey
    })
  }
}
const UserProfile = {
  template:"#userProfile",  props:["pageStack"],
  components:{customBar},
  data(){
    return {
      screenName:"",
      profile:"",
      id:dataTransporter.pop(),
    }
  },
  methods:{
    
  },
  mounted(){
    manager.seekUser(this.id).then(d=>{
      this.screenName=d.result.screenName
      this.profile=d.result.profile
    }).catch(()=>{
      this.screenName="Can't find this user data."
    })
  }
}

const ConnectionChart = {
  template:"#connectionChart",  props:["pageStack"],
  components:{customBar},
  data(){
    return {
      myConnectionList:manager.service.myConnectionList
    }
  }
}
Vue.use(VueOnsen)
new Vue({
  el:"#app",
  data(){
    if(localStorage.privKey){
      return {
        pageStack:[Home]
      }
    }else{
      return {
        pageStack:[First]
      }
    }
  },
  template:"#nav",
  beforeCreate(){
    //this.$ons.platform.select("ios");
    //this.$ons.disableAnimations();
    this.$ons.enableAutoStatusBarFill()
  },
  mounted(){
    manager.service.event.on("disconnected",(d)=>{
      this.$ons.notification.toast(d.id+" was disconnected.Reconnecting...",{timeout:2000})
    })
   
  }
})

window.addEventListener('load', function() {//Progressive Web App対応
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('dist/res/serviceWorker.js');
  }
});
