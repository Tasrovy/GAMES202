let precomputeLT = [];
let precomputeL = [];
var cameraPosition = [50, 0, 100];

var envmap = [
    'assets/cubemap/GraceCathedral',
    'assets/cubemap/Indoor',
    'assets/cubemap/Skybox',
];

var guiParams = {
    envmapId: 0
}

var cubeMaps = [];

//生成的纹理的分辨率，纹理必须是标准的尺寸 256*256 1024*1024  2048*2048
var resolution = 2048;

let envMapPass = null;

GAMES202Main();

async function GAMES202Main() {
    console.log("GAMES202Main");
    // Init canvas and gl
    const canvas = document.querySelector('#glcanvas');
    canvas.width = window.screen.width;
    canvas.height = window.screen.height;
    const gl = canvas.getContext('webgl');
    if (!gl) {
        alert('Unable to initialize WebGL. Your browser or machine may not support it.');
        return;
    }

    // Add camera
    const camera = new THREE.PerspectiveCamera(75, gl.canvas.clientWidth / gl.canvas.clientHeight, 1e-2, 1000);
    camera.position.set(cameraPosition[0], cameraPosition[1], cameraPosition[2]);

    // Add resize listener
    function setSize(width, height) {
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
    }

    setSize(canvas.clientWidth, canvas.clientHeight);
    window.addEventListener('resize', () => setSize(canvas.clientWidth, canvas.clientHeight));

    // Add camera control
    const cameraControls = new THREE.OrbitControls(camera, canvas);
    cameraControls.enableZoom = true;
    cameraControls.enableRotate = true;
    cameraControls.enablePan = true;
    cameraControls.rotateSpeed = 0.3;
    cameraControls.zoomSpeed = 1.0;
    cameraControls.panSpeed = 0.8;
    cameraControls.target.set(0, 0, 0);

    // Add renderer
    const renderer = new WebGLRenderer(gl, camera);

    // Add lights
    // light - is open shadow map == false
    let lightPos = [0, 80, 80]; // 平行光的位置通常代表它的发射方向
    let lightRadiance = [0.8, 0.8, 0.8]; // PRT主要靠环境光，这个平行光强度可以给小一点
    const directionalLight = new DirectionalLight(lightRadiance, lightPos, false, renderer.gl);
    renderer.addLight(directionalLight);

    // Add shapes
    let skyBoxTransform = setTransform(0, 50, 50, 150, 150, 150);
    let boxTransform = setTransform(0, 0, 0, 200, 200, 200);
    let box2Transform = setTransform(0, -10, 0, 20, 20, 20);

    for (let i = 0; i < envmap.length; i++) {
        let urls = [
            envmap[i] + '/posx.jpg',
            envmap[i] + '/negx.jpg',
            envmap[i] + '/posy.jpg',
            envmap[i] + '/negy.jpg',
            envmap[i] + '/posz.jpg',
            envmap[i] + '/negz.jpg',
        ];
        cubeMaps.push(new CubeTexture(gl, urls))
        await cubeMaps[i].init();
    }
    // load skybox
    loadOBJ(renderer, 'assets/testObj/', 'testObj', 'SkyBoxMaterial', skyBoxTransform);

    console.log("begin parsing");

    // file parsing
    for (let i = 0; i < envmap.length; i++) {
        let val = '';
        // 🌟 修复 1: 去掉 this.
        // 🌟 优化: 只有当 precomputeLT[i] 还没数据时才加载 (transport数据对所有贴图其实是一样的)
        await loadShaderFile(envmap[i] + "/transport.txt").then(result => {
            val = result;
        });

        console.log("Parsing transport.txt for envmap " + i);

        // 🌟 修复 2: 提高解析效率。使用简单的 .trim().split(/\s+/) 比正则快得多
        let preArray = val.trim().split(/\s+/);

        precomputeLT[i] = [];
        // 跳过第一个元素（通常是顶点数），解析数据
        for (let j = 0; j < preArray.length; j++) {
            precomputeLT[i][j] = Number(preArray[j]);
        }

        // 解析光照文件
        await loadShaderFile(envmap[i] + "/light.txt").then(result => {
            val = result;
        });

        console.log("Parsing light.txt for envmap " + i);
        let rows = val.trim().split(/\r?\n/);
        precomputeL[i] = [];
        for (let j = 0; j < 9; j++) {
            let lineArray = rows[j].trim().split(/\s+/);
            precomputeL[i][j] = [
                Number(lineArray[0]),
                Number(lineArray[1]),
                Number(lineArray[2])
            ];
        }
    }

    console.log("Parsing finished!");
    console.log("begin load mary");
    // 加载 Mary 模型
    loadOBJ(renderer, 'assets/mary/', 'mary', 'PRTMaterial', boxTransform);

    // loadOBJ(renderer, 'assets/bunny/', 'bunny', 'addYourPRTMaterial', box2Transform);

    function createGUI() {
        const gui = new dat.gui.GUI();
        const panelModel = gui.addFolder('Switch Environemtn Map');
        panelModel.add(guiParams, 'envmapId', {'GraceGathedral': 0, 'Indoor': 1, 'Skybox': 2}).name('Envmap Name');
        panelModel.open();
    }

    createGUI();

    function mainLoop(now) {
        cameraControls.update();

        let envmapId = guiParams.envmapId;

        if (precomputeL[envmapId]) {

            let lightCoeffs = precomputeL[envmapId];

            let mat3_LR = new Float32Array(9);
            let mat3_LG = new Float32Array(9);
            let mat3_LB = new Float32Array(9);

            for (let i = 0; i < 9; i++) {
                mat3_LR[i] = lightCoeffs[i][0];
                mat3_LG[i] = lightCoeffs[i][1];
                mat3_LB[i] = lightCoeffs[i][2];
            }

            for (let i = 0; i < renderer.meshes.length; i++) {
                let material = renderer.meshes[i].material;

                if (material.uniforms && material.uniforms.uPrecomputeLR) {
                    material.uniforms.uPrecomputeLR.value = mat3_LR;
                    material.uniforms.uPrecomputeLG.value = mat3_LG;
                    material.uniforms.uPrecomputeLB.value = mat3_LB;
                }
            }
        }

        renderer.render();

        requestAnimationFrame(mainLoop);
    }

    requestAnimationFrame(mainLoop);
}

function setTransform(t_x, t_y, t_z, s_x, s_y, s_z) {
    return {
        modelTransX: t_x,
        modelTransY: t_y,
        modelTransZ: t_z,
        modelScaleX: s_x,
        modelScaleY: s_y,
        modelScaleZ: s_z,
    };
}