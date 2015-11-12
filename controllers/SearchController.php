<?php
namespace app\controllers;

use yii\rest\ActiveController;
use yii\data\ActiveDataProvider;
use app\models;

class SearchController extends ActiveController
{
 public $modelClass = 'app\models\Resource';
 public $serializer = [ 'class' => 'yii\rest\Serializer', 'collectionEnvelope' => 'items'];
 public $resourceParameter = 'app\models\Parameter';
 public $resourceAttribute = 'app\models\ResourceAttribute';

 public function behaviors()
 {
  return
   \yii\helpers\ArrayHelper::merge(parent::behaviors(), [
    'corsFilter' => [
     'class' => \yii\filters\Cors::className(),
    ],
   ]);
 }
 public function actionGetresourcebycoordinate()
 {
  $get = \Yii::$app->request->get();
  $lat = $get['center_lat'];
  $lng = $get['center_lng'];
  $radius = $get['radius'];
 
  $model = new $this->modelClass;
  $query = $model::find();
 
  $dataProvider = new ActiveDataProvider([
    'query' => $query,
    'pagination' => false,
  ]);
 
  $query->andFilterWhere(['<=', "distance(coords_center_lat, coords_center_lng, $lat, $lng)", $radius]);
  return $dataProvider;
 }
 public function actionSearch()
 {
  $get = \Yii::$app->request->get();
  $request = Array();
  $request['resource'] = $this->getSearchRequestFor('resource', $get);
  $request['owner'] = $this->getSearchRequestFor('owner', $get);
  $request['parameter'] = $this->getSearchRequestFor('parameter', $get);

  return $this->getResponse($request);
 }
 public function getResponse($request)
 {
  $model = new $this->modelClass;
  $query = $model::find();

  $dataProvider = new ActiveDataProvider([
   'query' => $query,
   'pagination' => [
    'pageSize' => 4,
      'pageParam' => 'page',
   ],
  ]);
  $query->andFilterWhere([
   'and',
   ['like', 'name', $request['resource']['name']],
   ['class_id' => $request['resource']['class_id']],
   ['like', 'reason', explode(' ', $request['resource']['reason'])],
   ['like', 'registration_number', $request['resource']['registration_number']],
     
  ]);
  
  $parameters = ( $request['parameter'] )? $this->subQueryParameter($request['parameter']) : '';
  $owners = ( $request['owner'] )? $this->subQueryOwners($request['owner']) : '';

  $query->andFilterWhere([
   'owner_data_id' => $owners,
   'resource_id' => $parameters,
  ]);
  return $dataProvider;
 }
 private function subQueryOwners($request){
  $personalDataModel = 'app\models\PersonalData';
  $pdata = new $personalDataModel;

  $owners = $pdata::find()
   ->select('personal_data_id')
   ->andFilterWhere([
    'and',
    ['like', 'first_name', $request['first_name']],
    ['like', 'last_name', $request['last_name']],
    ['like', 'middle_name', $request['middle_name']],
   ]);
  return $owners;
 }
 private function subQueryParameter($request){
  $query_params = $this->getParametersQuery($request);

  for($i = count($query_params); $i >= 1; $i--){
   $query_params[$i - 1]->andFilterWhere(['resource_id' => $query_params[$i]]);
  }

  $parameterModel = 'app\models\Parameter';
  $parameter = new $parameterModel;
  $parameters = $parameter::find()
   ->select('resource_id')
   ->andFilterWhere(['resource_id' => $query_params[0]
   ]);
  return $parameters;
 }
 function getValue($input, $index){
  $values = explode('to', $input);
  return $values[$index - 1];
 }
 public function getParametersQuery($request)
 {
  $attributeModel = new $this->resourceAttribute;
  $parameterModel = new $this->resourceParameter;

  $allAttributes = $attributeModel::find()->asArray()->all();

  $attributes = array();
  for($i = 0; $i < count($allAttributes); $i++){
   $keys = array_values($allAttributes[$i]);
   $attributes[$keys[0]] = $keys[1];
  }

  $parametersQuery = array();
  foreach($request as $key => $value){
   $query = $parameterModel::find()
    ->select('resource_id')
    ->andFilterWhere([
     'and',
     ['attribute_id' => array_search($key, $attributes)],
     ['>=', 'value', $this->getValue($value, 1)],
     ['<=', 'value', $this->getValue($value, 2)],
    ]);

   array_push($parametersQuery, $query);
  }

  return $parametersQuery;
 }
 private function getSearchRequestFor($model, $get)
 {
  $passModel = false;
  $request = Array();
  foreach ($get as $key => $value) {
   if( $passModel ){
    if( $value === 'model' ) break;
    if( $key === 'page' || $key === 'per-page') continue;
    $request[$key] = $value;
   }
   if( $key === $model ){
    unset($get[$model]);
    $passModel = true;
   }
  }
  return $request;
 }
}