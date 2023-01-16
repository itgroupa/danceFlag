import { Component, ElementRef, AfterViewInit, ViewChild } from '@angular/core';
import {
  AudioListener,
  Color,
  Matrix4,
  Mesh,
  PerspectiveCamera,
  Scene,
  Vector3,
  WebGLRenderer,
  Audio as TreeAudio,
  AudioAnalyser,
  MeshPhongMaterial,
  DirectionalLight,
  SphereGeometry,
} from 'three';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements AfterViewInit {
  title = 'ThreeJs';

  private file = './assets/bitOk.ogg';
  private mediaElement = new Audio(this.file);
  private analyser?: AudioAnalyser;

  @ViewChild('canvas')
  private canvasRef!: ElementRef<HTMLCanvasElement>;

  private get canvas(): HTMLCanvasElement {
    return this.canvasRef.nativeElement;
  }

  play = () => {
    const fftSize = 128;
    const listener = new AudioListener();
    const audio = new TreeAudio(listener);

    audio.setMediaElementSource(this.mediaElement);

    this.analyser = new AudioAnalyser(audio, fftSize);
    this.mediaElement.play();
    this.canvasRef.nativeElement.removeEventListener('click', this.play);
  };

  ngAfterViewInit(): void {
    this.canvasRef.nativeElement.addEventListener('click', this.play);

    const renderer: WebGLRenderer = new WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: true,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);

    const scene: Scene = new Scene();
    scene.background = new Color(0, 0, 0);

    const camera: PerspectiveCamera = new PerspectiveCamera(
      120,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    const cameraZ = 350;
    const cameraY = 300;
    camera.position.z = cameraZ;
    camera.position.x = 0;
    camera.position.y = cameraY;
    const rotateY = new Matrix4().makeRotationY(0.003);

    camera.lookAt(
      new Vector3(scene.position.x, scene.position.y, scene.position.z + 150)
    );
    camera.updateMatrix();

    const geometry = new SphereGeometry(4, 10, 10);

    const width = 700;
    const height = 700;
    const step = 7;

    let arr: Mesh[][] = new Array(width / step);

    const redColor = new Color(255, 0, 0);
    const blueColor = new Color(0, 0, 255);
    const darkColor = new Color(120, 120, 120);

    let xx = 0;
    for (let x = 0; x < width; x += step) {
      arr[xx] = new Array(height / step);
      let yy = 0;
      for (let y = 0; y < height; y += step) {
        let cube: Mesh;
        if (y <= height / 3) {
          //dark
          const material = new MeshPhongMaterial({
            color: darkColor,
            shininess: 150,
            specular: 0x111111,
          });
          cube = new Mesh(geometry, material);
        } else if (y > height / 3 && y < height - height / 3) {
          // blue
          const material = new MeshPhongMaterial({
            color: blueColor,
            shininess: 150,
            specular: 0x111111,
          });
          cube = new Mesh(geometry, material);
        } else {
          // red
          const material = new MeshPhongMaterial({
            color: redColor,
            shininess: 150,
            specular: 0x222222,
          });
          cube = new Mesh(geometry, material);
        }

        cube.position.x = (width / 2) * -1 + x;
        cube.position.z = (height / 2) * -1 + y;
        scene.add(cube);

        arr[xx][yy] = cube;
        yy++;
      }
      xx++;
    }

    scene.add(camera);

    const dirLight = new DirectionalLight(0xffffff, 1);
    dirLight.name = 'Dir. Light';
    dirLight.position.set(300, 300, 300);
    scene.add(dirLight);

    let interval = 0;
    const speed = 0.03;

    const countWaveX = 1;
    const countWaveY = 1;
    const heightWave = 70;

    const widthWave = parseInt(width / countWaveX + '');
    const deepWave = parseInt(height / countWaveY + '');

    const render = () => {
      const musicData = this.analyser?.getFrequencyData();
      const musicScale = !musicData ? 1 : musicData[41] / 70;

      camera.applyMatrix4(rotateY);

      for (let x = 0; x < arr.length; x++)
        for (let y = 0; y < arr[x].length; y++) {
          const trueX = (width / 2) * -1 + x * step;
          const trueZ = (height / 2) * -1 + y * step;
          const fixX =
            Math.cos(
              ((trueX % widthWave) / widthWave) * (2 * Math.PI) + interval
            ) * heightWave;
          const fixY = Math.sin(
            ((trueZ % deepWave) / deepWave) * (2 * Math.PI) + interval
          );
          const trueY = fixX * fixY * musicScale;

          const scale =
            ((trueY * 0.2 - -1 * heightWave) / (heightWave * 2)) *
            (musicScale < 0.5 ? 0.5 : musicScale > 1 ? 1 : musicScale);

          arr[x][y].position.y = trueY;
          arr[x][y].scale.set(scale, scale, scale);
        }

      renderer.render(scene, camera);
      interval += speed;
    };

    this.animate(render);
  }

  animate(func: () => void) {
    requestAnimationFrame(() => this.animate(func));

    func();
  }
}
