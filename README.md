
installation

``` bash
git clone git@github.com:itbienvenu/cardmask.git
```

``` bash
cd carddmask
```



install npm packages

``` bash
npm install
```


the start command, to test the core app logic simulation 

``` bash
npx tsx server.ts --watch
```

CURRENT STATUS



## TO START THE DEVELOPMENT SERVER

Run the Web Application (Dashboard Mode) This starts the backend API and the frontend dashboard.

``` bash
npm run dev
```

then to open the live web view for demo testing 

``` bash
http://localhost:3000/index.html
```


for error checking run

``` bash
npx tsc --noEmit 
```

Run the Console Simulation Mode If you just want to see how the logic works under the hood without the web interface, run the simulation script:

``` bash
npm run simulate
```

![MVP Status](assets/in_mvp.png)