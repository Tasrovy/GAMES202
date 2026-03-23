class PRTMaterial extends Material { // 建议改名为 PRTMaterial，当然你保留 SHPhongMaterial 也可以

    constructor(color, specular, light, translate, scale, vertexShader, fragmentShader) {
        let lightMVP = light.CalcLightMVP(translate, scale);
        let lightIntensity = light.mat.GetIntensity();

        super({
                // === 原有的 Phong 和 Shadow 变量 (保留以防框架报错) ===
                'uSampler': { type: 'texture', value: color },
                'uKs': { type: '3fv', value: specular },
                'uLightRadiance': { type: '3fv', value: lightIntensity },
                'uShadowMap': { type: 'texture', value: light.fbo },
                'uLightMVP': { type: 'matrix4fv', value: lightMVP },

                // === 新增：PRT 预计算环境光 SH 系数 (Lighting) ===
                // 使用 Float32Array 初始化，防止 WebGL 在第一帧数据未传入时报错
                'uPrecomputeLR': { type: 'matrix3fv', value: new Float32Array(9) },
                'uPrecomputeLG': { type: 'matrix3fv', value: new Float32Array(9) },
                'uPrecomputeLB': { type: 'matrix3fv', value: new Float32Array(9) },

            },
            ['aPrecomputeLT'], // Vertex Shader 接收的顶点传输 SH 系数 (Transport)
            vertexShader, fragmentShader, null);
    }
}

async function buildPRTMaterial(color, specular, light, translate, scale, vertexPath, fragmentPath) {
    let vertexShader = await getShaderString(vertexPath);
    let fragmentShader = await getShaderString(fragmentPath);
    console.log("buildPRTMaterial");
    return new PRTMaterial(color, specular, light, translate, scale, vertexShader, fragmentShader);
}