if(!self.define){let e,s={};const a=(a,i)=>(a=new URL(a+".js",i).href,s[a]||new Promise((s=>{if("document"in self){const e=document.createElement("script");e.src=a,e.onload=s,document.head.appendChild(e)}else e=a,importScripts(a),s()})).then((()=>{let e=s[a];if(!e)throw new Error(`Module ${a} didn’t register its module`);return e})));self.define=(i,n)=>{const c=e||("document"in self?document.currentScript.src:"")||location.href;if(s[c])return;let r={};const d=e=>a(e,c),t={module:{uri:c},exports:r,require:d};s[c]=Promise.all(i.map((e=>t[e]||d(e)))).then((e=>(n(...e),r)))}}define(["./workbox-40866503"],(function(e){"use strict";importScripts("fallback-QeK8MxDGfwlfDuS3Rb8o0.js"),self.skipWaiting(),e.clientsClaim(),e.precacheAndRoute([{url:"/_next/static/QeK8MxDGfwlfDuS3Rb8o0/_buildManifest.js",revision:"b672d36ea8a55f29dcdb2b70c8db9d6e"},{url:"/_next/static/QeK8MxDGfwlfDuS3Rb8o0/_ssgManifest.js",revision:"b6652df95db52feb4daf4eca35380933"},{url:"/_next/static/chunks/235-95726fd1a2b85fa0.js",revision:"95726fd1a2b85fa0"},{url:"/_next/static/chunks/358-51d29b154897846a.js",revision:"51d29b154897846a"},{url:"/_next/static/chunks/671-1a4d1b4d44705842.js",revision:"1a4d1b4d44705842"},{url:"/_next/static/chunks/75fc9c18-e61c2e0d9c9a0957.js",revision:"e61c2e0d9c9a0957"},{url:"/_next/static/chunks/949-78842ded16ef3bbf.js",revision:"78842ded16ef3bbf"},{url:"/_next/static/chunks/framework-4556c45dd113b893.js",revision:"4556c45dd113b893"},{url:"/_next/static/chunks/main-86f1ce46715be0d4.js",revision:"86f1ce46715be0d4"},{url:"/_next/static/chunks/pages/404-b50b65ad37be41ed.js",revision:"b50b65ad37be41ed"},{url:"/_next/static/chunks/pages/500-79f84cb1729a4af1.js",revision:"79f84cb1729a4af1"},{url:"/_next/static/chunks/pages/_app-19c9feb2b2ea2b28.js",revision:"19c9feb2b2ea2b28"},{url:"/_next/static/chunks/pages/_error-a4ba2246ff8fb532.js",revision:"a4ba2246ff8fb532"},{url:"/_next/static/chunks/pages/_offline-47837ed867eecd73.js",revision:"47837ed867eecd73"},{url:"/_next/static/chunks/pages/contact-c1b73edfd0367822.js",revision:"c1b73edfd0367822"},{url:"/_next/static/chunks/pages/index-5693a4239ab3bd89.js",revision:"5693a4239ab3bd89"},{url:"/_next/static/chunks/pages/news-72c2a10040705dec.js",revision:"72c2a10040705dec"},{url:"/_next/static/chunks/pages/news/%5Bslug%5D-f4b5461dd5081155.js",revision:"f4b5461dd5081155"},{url:"/_next/static/chunks/pages/newsCategories/%5Bslug%5D-d809dac1543e89a1.js",revision:"d809dac1543e89a1"},{url:"/_next/static/chunks/pages/newsTags/%5Bslug%5D-8acca9eb1daa6a3c.js",revision:"8acca9eb1daa6a3c"},{url:"/_next/static/chunks/pages/search/%5Bsearch%5D-7ac3cab621e1bcbd.js",revision:"7ac3cab621e1bcbd"},{url:"/_next/static/chunks/pages/signin-19d9546d14fa6369.js",revision:"19d9546d14fa6369"},{url:"/_next/static/chunks/pages/signup-30f34d49e172c8d2.js",revision:"30f34d49e172c8d2"},{url:"/_next/static/chunks/pages/users-58d0d770fce26ae0.js",revision:"58d0d770fce26ae0"},{url:"/_next/static/chunks/pages/users/%5Bid%5D-fbf6cc500c076868.js",revision:"fbf6cc500c076868"},{url:"/_next/static/chunks/pages/users/newsDrafts/%5Bslug%5D-5e7dff87af269d5f.js",revision:"5e7dff87af269d5f"},{url:"/_next/static/chunks/polyfills-c67a75d1b6f99dc8.js",revision:"837c0df77fd5009c9e46d446188ecfd0"},{url:"/_next/static/chunks/webpack-cb7634a8b6194820.js",revision:"cb7634a8b6194820"},{url:"/_next/static/css/1cdbadac87c5dc23.css",revision:"1cdbadac87c5dc23"},{url:"/_next/static/images/logo-c55dea409bb93260ab92edee6e4da90e.png",revision:"QeK8MxDGfwlfDuS3Rb8o0"},{url:"/_next/static/images/spinner1-45df2d82dca079e9214ffa24c9e3f9ea.gif",revision:"QeK8MxDGfwlfDuS3Rb8o0"},{url:"/_offline",revision:"QeK8MxDGfwlfDuS3Rb8o0"},{url:"/assets/css/style-starter.css",revision:"0d645a5293cba01514d48ab65521d027"},{url:"/assets/fonts/FontAwesome.otf",revision:"0d2717cd5d853e5c765ca032dfd41a4d"},{url:"/assets/fonts/fontawesome-webfont.eot",revision:"674f50d287a8c48dc19ba404d20fe713"},{url:"/assets/fonts/fontawesome-webfont.svg",revision:"912ec66d7572ff821749319396470bde"},{url:"/assets/fonts/fontawesome-webfont.ttf",revision:"b06871f281fee6b241d60582ae9369b9"},{url:"/assets/fonts/fontawesome-webfont.woff",revision:"fee66e712a8a08eef5805a46892932ad"},{url:"/assets/fonts/fontawesome-webfont.woff2",revision:"af7ae505a9eed503f8b8e6982036873e"},{url:"/assets/images/1.jpg",revision:"f5f25c919c2a1701b76a2d888377f904"},{url:"/assets/images/10.jpg",revision:"0ab33e9f70698a5cdb0886eb0940ec45"},{url:"/assets/images/11.jpg",revision:"e5c88809718ea11739aa32d094a24b10"},{url:"/assets/images/12.jpg",revision:"c3048da507f4629a11a63e1c7ef50668"},{url:"/assets/images/13.jpg",revision:"4aed59501f2eb4fcce9e12196eabba15"},{url:"/assets/images/14.jpg",revision:"32d335d771281284dfd711544cdf4625"},{url:"/assets/images/15.jpg",revision:"cc7164089b3180b8889f1444f2167a14"},{url:"/assets/images/16.jpg",revision:"d93b0cf495d914060feb3097d54ee71d"},{url:"/assets/images/17.jpg",revision:"bff90d0ec86d6f96c68b5dac57e0d0e4"},{url:"/assets/images/18.jpg",revision:"a0c1a529651e0da906bb64701adead7f"},{url:"/assets/images/19.jpg",revision:"6ff656c0bd79b83e32e0d381346f8f40"},{url:"/assets/images/2.jpg",revision:"19ec1015cc341cc720bad5d539fe6f13"},{url:"/assets/images/20.jpg",revision:"3f33b4eb7cd18c26b87747c4e8f126de"},{url:"/assets/images/3.jpg",revision:"6d8f83f8f4495b71d2cac6b927bfb46e"},{url:"/assets/images/4.jpg",revision:"fd7db8ea3d6754ba7179c3d33d7a5f60"},{url:"/assets/images/5.jpg",revision:"b581e2d9c85e4de5edcae54cec42547d"},{url:"/assets/images/6.jpg",revision:"cf1a6ed08fdad9219ff70a8d6f28e18f"},{url:"/assets/images/7.jpg",revision:"7f993e09beb12cbd90a90db13b1b1cb8"},{url:"/assets/images/8.jpg",revision:"35bc29d6a708a9b0a8de89003d54ba34"},{url:"/assets/images/9.jpg",revision:"d1ddef36def7f43cde7c9113d4b90e0a"},{url:"/assets/images/ad.gif",revision:"c3863842028691ef93cc007eb75db4f5"},{url:"/assets/images/ad.jpg",revision:"9d7c0a32cf322bfe726bc52b7361a051"},{url:"/assets/images/ad.png",revision:"ddb2793f24e2dc560e3364c1da02c898"},{url:"/assets/images/ad1.jpg",revision:"dac7cdd21575495378363d601dcce82d"},{url:"/assets/images/author.jpg",revision:"d2b3918c3972f30afa5a07bf4732459c"},{url:"/assets/images/b1.jpg",revision:"718114343d93a90f35079b0d1ac34380"},{url:"/assets/images/blog.jpg",revision:"80e615ce506fe3b493d061839cdd5fcf"},{url:"/assets/images/error.png",revision:"37e557a6ea12e790fbce8fca253b448f"},{url:"/assets/images/p.jpg",revision:"eca076cb8d57e3fdf0d76fa8dba64e42"},{url:"/assets/images/p1.jpg",revision:"2f1b0ba59e5e6b9d10477b3a36273792"},{url:"/assets/images/p2.jpg",revision:"5afeddeb90b9f34fda0e6e87c88eccaf"},{url:"/assets/images/p3.jpg",revision:"3ec2675183674b06fd96e0e29417df19"},{url:"/assets/images/p4.jpg",revision:"a7a9a0843504c716582cb88bc3dad3b1"},{url:"/assets/images/p5.jpg",revision:"961237e508a13d2a36cb0cd01de5bf56"},{url:"/assets/images/p6.jpg",revision:"84599abcae52df7c0f5aa66e1b8cbc19"},{url:"/assets/images/p7.jpg",revision:"e070273dc56f8e4aa9fc0a6ea17b1dd4"},{url:"/assets/images/p8.jpg",revision:"6d22abca820686a936500a7c5e79c1d0"},{url:"/assets/js/bootstrap.min.js",revision:"3124830b38a09aa657146da1830ea543"},{url:"/assets/js/footer.js",revision:"41fe87f6979ac449528cf5076030eb13"},{url:"/assets/js/jquery-3.3.1.min.js",revision:"eae16259ac35f01fa3462d9751055535"},{url:"/assets/js/navbar-toggler.js",revision:"a74e75d6cdea978a76f3e65d93eca8c9"},{url:"/assets/js/theme-change.js",revision:"d4444ee044ac3eba592b98af3bc518c4"},{url:"/favicon-16.png",revision:"8ae78d5e368157bbca4b4ba85667049b"},{url:"/favicon-32.png",revision:"fedd61aae458d38b15b18c653e91b70f"},{url:"/favicon-48.png",revision:"44d8aeccae8258b0ce633f376ff99565"},{url:"/favicon.ico",revision:"0925eb32258e0c282fdaaee30424f486"},{url:"/icon-128x128.png",revision:"9cedef27c3a947942ce3d71e944b1d2d"},{url:"/icon-192x192.png",revision:"9f426d4fc85429b7b331ae8943589b23"},{url:"/icon-52x52.png",revision:"515be7dc736181e627e22a9ef0c383bc"},{url:"/icon-72x72.png",revision:"61c284070b1457c2523a0f4db4f8e8f3"},{url:"/icon.svg",revision:"35fcf5c4e144e7fa3cda52aa0923d0aa"},{url:"/images/icons/icon-128x128.png",revision:"faf4b28ee848f81cf352f9129be4e271"},{url:"/images/icons/icon-144x144.png",revision:"91bc13e8c05e8dbaeb316a14691317cd"},{url:"/images/icons/icon-152x152.png",revision:"8acb13c97cd42da75b1bdac0cf1d8bd7"},{url:"/images/icons/icon-192x192.png",revision:"8f10a6eafd806f0340ba5e728faba7c4"},{url:"/images/icons/icon-384x384.png",revision:"d41d8cd98f00b204e9800998ecf8427e"},{url:"/images/icons/icon-512x512.png",revision:"de568ac3749c2ada65ad987aa6408820"},{url:"/images/icons/icon-72x72.png",revision:"a816040a5038eaa0315310835002662f"},{url:"/images/icons/icon-96x96.png",revision:"0feeae7283d31d3187fbd869f5ad8197"},{url:"/logo192.png",revision:"f73040f2e2433f41fd654556c5a5c091"},{url:"/logo512.png",revision:"ea7b262d3e7b3b339c1821b24003379c"},{url:"/malanghub-meta.png",revision:"b749eb73b95e3c59063c992580bf80ea"},{url:"/manifest.json",revision:"f726db9016f8daca46bf074d9d6177d7"},{url:"/robots.txt",revision:"fa1ded1ed7c11438a9b0385b1e112850"},{url:"/touch-icon-ipad-retina.png",revision:"eb95d93a050987feefbe729fbbc0e6cb"},{url:"/touch-icon-ipad.png",revision:"a026f373cf03a2c130811ea35bc36e65"},{url:"/touch-icon-iphone-retina.png",revision:"be073efe666c487246d9b021744dc9d7"},{url:"/touch-icon-start-up-320x480.png",revision:"726c19389a152d338f3318de29d9d75c"},{url:"/vercel.svg",revision:"4b4f1876502eb6721764637fe5c41702"}],{ignoreURLParametersMatching:[]}),e.cleanupOutdatedCaches(),e.registerRoute("/",new e.NetworkFirst({cacheName:"start-url",plugins:[{cacheWillUpdate:async({request:e,response:s,event:a,state:i})=>s&&"opaqueredirect"===s.type?new Response(s.body,{status:200,statusText:"OK",headers:s.headers}):s},{handlerDidError:async({request:e})=>self.fallback(e)}]}),"GET"),e.registerRoute(/^https:\/\/fonts\.(?:gstatic)\.com\/.*/i,new e.CacheFirst({cacheName:"google-fonts-webfonts",plugins:[new e.ExpirationPlugin({maxEntries:4,maxAgeSeconds:31536e3}),{handlerDidError:async({request:e})=>self.fallback(e)}]}),"GET"),e.registerRoute(/^https:\/\/fonts\.(?:googleapis)\.com\/.*/i,new e.StaleWhileRevalidate({cacheName:"google-fonts-stylesheets",plugins:[new e.ExpirationPlugin({maxEntries:4,maxAgeSeconds:604800}),{handlerDidError:async({request:e})=>self.fallback(e)}]}),"GET"),e.registerRoute(/\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i,new e.StaleWhileRevalidate({cacheName:"static-font-assets",plugins:[new e.ExpirationPlugin({maxEntries:4,maxAgeSeconds:604800}),{handlerDidError:async({request:e})=>self.fallback(e)}]}),"GET"),e.registerRoute(/\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,new e.StaleWhileRevalidate({cacheName:"static-image-assets",plugins:[new e.ExpirationPlugin({maxEntries:64,maxAgeSeconds:86400}),{handlerDidError:async({request:e})=>self.fallback(e)}]}),"GET"),e.registerRoute(/\/_next\/image\?url=.+$/i,new e.StaleWhileRevalidate({cacheName:"next-image",plugins:[new e.ExpirationPlugin({maxEntries:64,maxAgeSeconds:86400}),{handlerDidError:async({request:e})=>self.fallback(e)}]}),"GET"),e.registerRoute(/\.(?:mp3|wav|ogg)$/i,new e.CacheFirst({cacheName:"static-audio-assets",plugins:[new e.RangeRequestsPlugin,new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400}),{handlerDidError:async({request:e})=>self.fallback(e)}]}),"GET"),e.registerRoute(/\.(?:mp4)$/i,new e.CacheFirst({cacheName:"static-video-assets",plugins:[new e.RangeRequestsPlugin,new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400}),{handlerDidError:async({request:e})=>self.fallback(e)}]}),"GET"),e.registerRoute(/\.(?:js)$/i,new e.StaleWhileRevalidate({cacheName:"static-js-assets",plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400}),{handlerDidError:async({request:e})=>self.fallback(e)}]}),"GET"),e.registerRoute(/\.(?:css|less)$/i,new e.StaleWhileRevalidate({cacheName:"static-style-assets",plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400}),{handlerDidError:async({request:e})=>self.fallback(e)}]}),"GET"),e.registerRoute(/\/_next\/data\/.+\/.+\.json$/i,new e.StaleWhileRevalidate({cacheName:"next-data",plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400}),{handlerDidError:async({request:e})=>self.fallback(e)}]}),"GET"),e.registerRoute(/\.(?:json|xml|csv)$/i,new e.NetworkFirst({cacheName:"static-data-assets",plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400}),{handlerDidError:async({request:e})=>self.fallback(e)}]}),"GET"),e.registerRoute((({url:e})=>{if(!(self.origin===e.origin))return!1;const s=e.pathname;return!s.startsWith("/api/auth/")&&!!s.startsWith("/api/")}),new e.NetworkFirst({cacheName:"apis",networkTimeoutSeconds:10,plugins:[new e.ExpirationPlugin({maxEntries:16,maxAgeSeconds:86400}),{handlerDidError:async({request:e})=>self.fallback(e)}]}),"GET"),e.registerRoute((({url:e})=>{if(!(self.origin===e.origin))return!1;return!e.pathname.startsWith("/api/")}),new e.NetworkFirst({cacheName:"others",networkTimeoutSeconds:10,plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400}),{handlerDidError:async({request:e})=>self.fallback(e)}]}),"GET"),e.registerRoute((({url:e})=>!(self.origin===e.origin)),new e.NetworkFirst({cacheName:"cross-origin",networkTimeoutSeconds:10,plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:3600}),{handlerDidError:async({request:e})=>self.fallback(e)}]}),"GET")}));
