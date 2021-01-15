import * as tf from "@tensorflow/tfjs";
import { useEffect, useState } from "preact/hooks";
import { h, render } from 'preact';
import 'preact/devtools';
import './App.css';


export default function App() {
  return (
    <div className="App">
      <Detection />
    </div>
  );
}

const pretrainedModel = {
  url:   "https://storage.googleapis.com/tfjs-models/tfjs/mobilenet_v1_0.25_224/model.json",
  layer: "conv_pw_13_relu",
};

function customModel() {
  const [state, setState] = useState([]);
  useEffect(() => {
    async function loadModel() {
      const mobilenet = await tf.loadLayersModel(pretrainedModel.url);
      const layer = mobilenet.getLayer(pretrainedModel.layer);
      const pretrained = await tf.model({
        inputs: mobilenet.inputs,
        outputs: layer.output,
      });
      const model = await tf.loadLayersModel(
        "./model/ml-classifier-mountain-sea.json",
      );
      setState([model, pretrained]);
    }
    loadModel();
  }, []);
  return state;
}

function Detection() {
  const [model, customizedModel] = customModel();
  const [previewUrl, setPreviewUrl] = useState();
  const [predictionStatus, setPredictionStatus] = useState();

  function loadImage(event) {
    const image = event.target.files[0]
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(image));
    setPredictionStatus("inProgress");
  }

  async function predict() {
    const pixels = tf.browser.fromPixels(document.querySelector("img"));
    const image = tf.reshape(pixels, [1, 224, 224, 3]).toFloat().div(tf.scalar(127)).sub(
      tf.scalar(1),
    );
    const modelPrediction = model.predict(customizedModel.predict(image));
    const [mountain, sea] = Array.from(modelPrediction.dataSync());
    console.log('montagne' + mountain);
    console.log('mer' + sea);
    setPredictionStatus(mountain >= sea ? 'Mountain' : 'Sea');
  }

  if (!model) return "Loading the model...";

  return (

	  
    <div id="main">   
      <div>
        <h1 class="lead">Is it a mountain or a sea?</h1>
				<h2 class="tagline">Classification App using Tensorflow.js </h2>
        <p>Select an image of either a mountain or a sea</p>
        <div id="inp" >
          <input type="file" onChange={loadImage} accept="image/*" />
        </div>
        {previewUrl &&
          <div id="pic">
            <img
              src={previewUrl}
              onLoad={predict}
              width={224}
              height={224}
              alt="preview"
            />
          </div>}
        {predictionStatus === "inProgress" ? "Predicting, please wait..." : <div id="pred">{predictionStatus}</div>}
      </div>
    </div>
  );
}