import React, { useEffect, Suspense, useRef, useState, useMemo } from 'react';
import './App.css';
import { Canvas, useLoader, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { OrbitControls, useFBX } from '@react-three/drei'
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";
import { useZxing } from "react-zxing";
import ResultPoint from '@zxing/library/esm/core/ResultPoint';

const FBXModel = (props:{setActionName: React.Dispatch<React.SetStateAction<string>>}) => {
  /* FBXモデル読込み */
  const fbx = useLoader(FBXLoader, "assets/Ch09_nonPBR.fbx");
  /* AnimationClip(s)読込み */
  const animCrips: THREE.AnimationClip[][] = []
  animCrips[0] = useFBX('./assets/BreakdanceEnding2.fbx').animations
  animCrips[1] = useFBX('./assets/BreakdanceUprockVar1.fbx').animations
  animCrips[2] = useFBX('./assets/HipHopDancing.fbx').animations
  animCrips[3] = useFBX('./assets/NorthernSoulSpin.fbx').animations
  animCrips[4] = useFBX('./assets/SwingDancing.fbx').animations
  animCrips[5] = useFBX('./assets/BreakdanceEnding1.fbx').animations
  const animNames = ['BreakdanceEnding2', 'BreakdanceUprockVar1', 'HipHopDancing', 'NorthernSoulSpin', 'SwingDancing', 'BreakdanceEnding1']
  /* 変数定義 */
  const mixer = useRef<THREE.AnimationMixer>();
  const [ animIdx, setAnimIdx ] = useState<number>(0);
  const animActions = useMemo(() => [] as THREE.AnimationAction[], [])

  /* 初期化 */
  useEffect(() => {
    fbx.scale.multiplyScalar(0.02)
    mixer.current = new THREE.AnimationMixer(fbx)
    animCrips.forEach((val: THREE.AnimationClip[], idx: number) => {
      if(!mixer.current) return;
      animActions[idx] = mixer.current.clipAction(val[0])
    })
    new Promise(() => setTimeout(() => {0}, 1000)).then(()=>animActions[0].play())
  }, [])

  /* モーション切替え処理 */
  useEffect(() => {
    const act: THREE.AnimationAction = animActions[animIdx]
    act?.reset().fadeIn(0.3).play()
    props.setActionName(animNames[animIdx] + ' : ' + animIdx)
    return () => {
      act?.fadeOut(0.3)
    }
  }, [animIdx])

  /* FPS処理 */
  useFrame((state, delta) => {
    if(mixer.current)
      mixer.current.update(delta);
    const durationtime: number= animActions[animIdx].getClip().duration
    const currenttime: number = animActions[animIdx].time
    if(currenttime/durationtime > 0.9/*90%を超えたら次のモーションへ*/) {
      const index: number = (animIdx+1) % (animCrips.length)
      setAnimIdx( index )
    }
  });

  return (
    <primitive object={fbx} position={[1, -1, 1]} />
  )
}

const ZxingQRCodeReader = (props:{setSize: React.Dispatch<React.SetStateAction<React.CSSProperties>>}) => {
  {/*  デバッグ用canvas */}
  const [context, setContext] = useState<CanvasRenderingContext2D>();
  const [points4, setPoints4] = useState<ResultPoint[]>();
  const [points3, setPoints3] = useState<ResultPoint[]>();

  const { ref } = useZxing({
    constraints: {
      audio: false,
      video: {
        facingMode: 'environment',
        width: { min: 1024, ideal: 1920, max: 1920 },
        height: { min: 576, ideal: 1080, max: 1080 },
      },
    },
    timeBetweenDecodingAttempts: 100,
    onDecodeResult(result) {
      console.log('onDecodeResult::result=', result);
      if(result.getResultPoints().length <= 0) return;

//        setResult(result.getText());

      const points: ResultPoint[] = result.getResultPoints()
      if(points.length%4 == 0)
        setPoints4(points);
      else if(points.length%3 == 0)
        setPoints3(points);
      console.log(points.length, " -----[0]: ", points[0]?.getX(), " ,", points[0]?.getY(),)
      console.log(points.length, " -----[1]: ", points[1]?.getX(), " ,", points[1]?.getY(),)
      console.log(points.length, " -----[2]: ", points[2]?.getX(), " ,", points[2]?.getY(),)
      console.log(points.length, " -----[3]: ", points[3]?.getX(), " ,", points[3]?.getY(),)
    },
  });

  /* Videoサイズ変更に合わせてCanvasサイズを変更する */
  useEffect(() => {
    if(!ref.current) return;
    props.setSize({width: ref.current.videoWidth, height: ref.current.videoHeight});
    const canvas = document.getElementById("canvas") as HTMLCanvasElement
    canvas.width = ref.current.videoWidth;
    canvas.width = ref.current.videoWidth;
    const context = canvas.getContext("2d")
    if(!context) return;
    setContext(context);
  }, [ref.current?.videoWidth, ref.current?.videoHeight]);

  console.log("ref.current?.videoxxx=(", ref.current?.videoWidth, ",", ref.current?.videoHeight, ")" );

  {/*  デバッグ用 3点取れた時の確認 */}
  useEffect(() => {
    if(!context) return;
    if(!points3) return;
    /* 対角線の中点を求める */
    const xpwr = Math.abs(points3[2].getX() - points3[0].getX());
    const xm   = Math.min(points3[2].getX() , points3[0].getX()) + xpwr/2;
    const ypwr = Math.abs(points3[2].getY() - points3[0].getY());
    const ym   = Math.min(points3[2].getY() , points3[0].getY()) + ypwr/2;
    const m = new ResultPoint( xm, ym);
    context.clearRect(0, 0, 1920, 1080)
    /* 中点を描画 */
    context.beginPath();
    context.arc(m.getX(), m.getY(), 10, 0, 2*Math.PI, false);
    context.fillStyle = 'green';
    context.fill();
    context.stroke()
    /* 矩形 */
    context.beginPath()
    context.moveTo( points3[0].getX(), points3[0].getY())
    context.lineTo( points3[1].getX(), points3[1].getY())
    context.lineTo( points3[2].getX(), points3[2].getY())
    /* 中心線 */
    context.moveTo( points3[0].getX(), points3[0].getY())
    context.lineTo( m.getX(), m.getY())
    context.moveTo( points3[1].getX(), points3[1].getY())
    context.lineTo( m.getX(), m.getY())
    context.moveTo( points3[2].getX(), points3[2].getY())
    context.lineTo( m.getX(), m.getY())
    /* 描画 */
    context.strokeStyle = "red";
    context.lineWidth = 2;
    context.stroke()
    context.font = "48px serif";
    context.fillText("0",points3[0].getX(), points3[0].getY())
    context.fillText("1",points3[1].getX(), points3[1].getY())
    context.fillText("2",points3[2].getX(), points3[2].getY())
  }, [points3]);

  {/*  デバッグ用 4点取れた時の確認 */}
  useEffect(() => {
    if(!context) return;
    if(!points4) return;
    context.clearRect(0, 0, 1920, 1080)
    /* 中点を求める */
    const m = CrossLineLine( points4[0], points4[1], points4[2], points4[3]);
    /* 中点を描画 */
    context.beginPath();
    context.arc(m.getX(), m.getY(), 10, 0, 2*Math.PI, false);
    context.fillStyle = 'green';
    context.fill();
    context.stroke()
    /* 矩形 */
    context.beginPath()
    context.moveTo( points4[0].getX(), points4[0].getY())
    context.lineTo( points4[1].getX(), points4[1].getY())
    context.lineTo( points4[2].getX(), points4[2].getY())
    context.lineTo( points4[3].getX(), points4[3].getY())
    /* 対角線 */
    context.moveTo( points4[0].getX(), points4[0].getY())
    context.lineTo( points4[2].getX(), points4[2].getY())
    context.moveTo( points4[1].getX(), points4[1].getY())
    context.lineTo( points4[3].getX(), points4[3].getY())
    context.strokeStyle = "red";
    context.lineWidth = 2;
    context.stroke()
    context.font = "48px serif";
    context.fillText("0",points4[0].getX(), points4[0].getY())
    context.fillText("1",points4[1].getX(), points4[1].getY())
    context.fillText("2",points4[2].getX(), points4[2].getY())
    context.fillText("3",points4[3].getX(), points4[3].getY())
  }, [points4]);


  return (
    <>
    <video ref={ref} />
      {/*  デバッグ用canvas */}
      <canvas id="canvas" width="1920" height="1080" style={{ position: "absolute", left: "0px",  top: "0px", background: "#0088ff44"}}></canvas>
    </>
  );
};

/**********************/
/* 2線分の交点を求める */
/* p1 ------ p2 */
/* |          | */
/* |          | */
/* |          | */
/* p0 ------ p3 */
/**********************/
const CrossLineLine = (p00: ResultPoint, p01: ResultPoint, p02: ResultPoint, p03: ResultPoint) => {
  const s1: number = ((p02.getX()-p00.getX())*(p01.getY()-p00.getY())-(p02.getY()-p00.getY())*(p01.getX()-p00.getX())) / 2.0;
  const s2: number = ((p02.getX()-p00.getX())*(p00.getY()-p03.getY())-(p02.getY()-p00.getY())*(p00.getX()-p03.getX())) / 2.0;
  const x: number = p01.getX()+(p03.getX()-p01.getX()) * s1 / (s1+s2);
  const y: number = p01.getY()+(p03.getY()-p01.getY()) * s1 / (s1+s2);
  return new ResultPoint( x, y);
}

const App = () => {
  const [actionName, setActionName] = useState<string>('aaabbb');
  const [size, setSize] = useState<React.CSSProperties>({width: "300px", height: "200px"});

  return (
    <div>
      <ZxingQRCodeReader setSize={setSize}/>
      <Canvas camera={{ position: [3, 1, 3] }} style={{ position: "absolute", left: "0px",  top: "0px", width: `${size.width}px`,  height: `${size.height}px`,}}>
        <ambientLight intensity={2} />
        <pointLight position={[40, 40, 40]} />
        <Suspense fallback={null}>
          <FBXModel setActionName={setActionName}/>
        </Suspense>
        <OrbitControls />
        <axesHelper args={[5]} />
        <gridHelper />
      </Canvas>
      <div id="summry" style={{background: "rgba(255, 192, 192, 0.7)"}}>{actionName}</div>
    </div>
  );
}

export default App;
