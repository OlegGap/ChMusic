import React, { Component } from "react";
import {
  Text,
  View,
  Image,
  TouchableOpacity,
  TouchableHighlight,
  StatusBar,
  Platform,
  BackHandler,
  I18nManager,
  FlatList,
  ActivityIndicator,
  ToastAndroid,
  SafeAreaView
  // ListView
} from "react-native";
import {
  Container,
  Header,
  Content,
  Button,
  Left,
  Right,
  Body,
  Separator,
  SwipeRow
} from "native-base";

import styles from "./styles";

import { Images, Metrics, Fonts, Colors } from "../../themes";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

import { ListItem, SearchBar } from 'react-native-elements';

import firebase from "react-native-firebase";
import FlashMessage, { showMessage, hideMessage } from "react-native-flash-message";

import AsyncStorage from '@react-native-community/async-storage';
import Ip from "../apihost";
const api_host = Ip.api_host;
var decoded = [];

let headers = new Headers();

var token = "";
// var token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7ImlkIjoxMTQsImVtYWlsIjoid2FuZ3dlaUBnbWFpbC5jb20iLCJ1c2VybmFtZSI6Indhbmd3ZWkiLCJwYXNzd29yZCI6IiQyYSQwOCRDSFNBQ1lxM2UxOWxHS3BMb082WWxlN0ttSjlDbE1BSUUxcjc2eDFOeXpCdXpSS1lhc3h1QyIsInBpYyI6bnVsbCwiZGF0ZV9yZWdpc3RyYXRpb24iOiIyMDE5LTA2LTEzVDEwOjE5OjAwLjAwMFoiLCJtZW1iZXJzaGlwIjpudWxsLCJ0ZWFtX2lkIjpudWxsLCJyb2xlIjpudWxsLCJwb3NpdGlvbiI6bnVsbH0sImlhdCI6MTU2MDUxNDkyMiwiZXhwIjoxNTYzMTA2OTIyfQ.xiPDzY1c_lC_qlIgxtGc5aTJioICV9MSdK4NFKpadrc";
headers.append('Access-Control-Allow-Origin', api_host);
headers.append('Access-Control-Allow-Credentials', 'true');
headers.append('Content-Type', 'application/json');
headers.append('authorization', 'Bearer ' + token);

var jwtDecode = require('jwt-decode');
var team_id = ''
var team = {
  'id': 0,
  'name': '',
  'position': '',
  'isJoined': false,
};

export default class Notification extends Component {
  constructor(props) {
    super(props);
    this.handleBackButtonClick = this.handleBackButtonClick.bind(this);
    this.state = {
      data: [],
      owner: '',
      joinState: 0,
      refreshing: false,
      loading: false
      // dataSource: dataObjects
    };
  }

  componentDidMount() {
    this.checkPermission();
    this.createNotificationListeners();

    try {
      this._retrieveData()
    } catch (e) {
      console.log(e);
    }
  }

  _retrieveData = async () => {
    try {
      const value = await AsyncStorage.getItem('token');
      team_id = await AsyncStorage.getItem('team_id');
      if (value !== null) {
        token = value;
        decoded = jwtDecode(value);
        this.getUserInfo();
        this.getOwnerInfo(team_id);
        this.readTeamInfo();
      }
    } catch (error) {
      // Error retrieving data
    }
  };

  async getUserInfo() {
    await fetch(api_host + '/user/get/' + decoded.user.id, {
      method: 'GET',
      headers: headers,
    })
      .then(response => {
        response.json().then(data => {
          this.setState({
            joinState: data[0].join_state
          })
        })
      })
  }

  async getOwnerInfo(team_id) {
    if (team_id !== null && team_id != '')
      await fetch(api_host + '/team/getOwnerByTeamId/' + team_id, {
        method: 'GET',
        headers: headers,
      })
        .then(response => {
          response.json().then(data => {
            if (decoded.user.id == data[0].created_by)
              this.setState({
                owner: "owner"
              })
            else
              this.setState({
                owner: "user"
              })
            console.log("what is your id = " + data[0].created_by)
          })
        })
  }

  readTeamInfo() {
    this.setState({ loading: true })
    fetch(api_host + '/user/' + decoded.user.id + '/getTeam', {
      method: 'GET',
      headers: headers
    })
      .then(response => {
        response.json().then(data => {
          if (data.teamInfo.length > 0) {
            fetch(api_host + '/team/getById/' + data.teamInfo[0].team_id, {
              method: 'GET',
              headers: headers
            }).then(response => {
              response.json().then(data => {
                team = data.members;
                this.setState({ data: team, loading: false, refreshing: false });
                this.arrayholder = team;
              })
            });
          } else {
            this.setState({ loading: false, refreshing: false });
            AsyncStorage.removeItem('team_id')
            AsyncStorage.removeItem('team_name')
            this.props.navigation.navigate("TeamList")
          }
        })
      })
      .catch(error => {
        this.setState({ loading: false, refreshing: false });
      })
  }

  renderSeparator = () => {
    return (
      <View
        style={{
          height: 2,
          marginLeft: Metrics.WIDTH * 0.17,
          width: Metrics.WIDTH * 0.83,
          backgroundColor: '#CED0CE',
        }}
      />
    );
  };

  searchFilterFunction = text => {
    this.setState({
      value: text,
    });

    const newData = this.arrayholder.filter(item => {
      const itemData = `${item.username.toUpperCase()}`;
      const textData = text.toUpperCase();

      return itemData.indexOf(textData) > -1;
    });
    this.setState({
      data: newData,
    });
  };

  renderHeader = () => {
    return (
      <SearchBar
        placeholder="Search..."
        lightTheme
        round
        onChangeText={text => this.searchFilterFunction(text)}
        autoCorrect={false}
        value={this.state.value}
      />
    );
  };

  renderFooter = () => {
    if (!this.state.loading || this.state.refreshing) return null;

    return (
      <View
        style={{
          paddingVertical: 20,
          borderTopWidth: 1,
          borderColor: "#CED0CE"
        }}>
        <ActivityIndicator animating size="large" />
      </View>
    );
  }

  handleRefresh = () => {
    this.setState({
      refreshing: true,
    })
    this.readTeamInfo()
  }

  componentWillMount() {
    BackHandler.addEventListener("hardwareBackPress", this.handleBackButtonClick);
  }

  componentWillUnmount() {
    this.notificationListener();
    this.notificationOpenedListener();
    this.messageListener();
    BackHandler.removeEventListener("hardwareBackPress", this.handleBackButtonClick);
  }

  handleBackButtonClick = () => {
    // this.props.navigation.navigate("Login");
    // this.props.navigation.goBack(null);
    // Actions.pop();
    return true;
  };

  async acceptClick(id) {
    console.log("owner " + this.state.owner)
    fetch(api_host + '/user/' + id + '/joinTeam/' + team_id, {
      method: 'POST',
      body: JSON.stringify({
        position: 'Member',
        join_state: 2
      }),
      headers: headers
    })
      .then(response => {
        this.setState({
          joinState: 2
        })
        firebase
          .firestore()
          .collection("users")
          .where("userId", "==", id)
          .onSnapshot(querySnapShot => {
            console.log(querySnapShot)
            querySnapShot.forEach(user => {
              console.log("firebase user data = ", user)
              if (user.data().id != null || user.data().id != 0)
                firebase
                  .firestore()
                  .collection("users")
                  .doc(user.data().authId)
                  .update({
                    teamId: parseInt(team_id)
                  })
            });
          }
          );
        this.readTeamInfo()
      });
  }

  async declineClick(id, name) {
    console.log("why did you clicked?")
    await fetch(api_host + '/user/' + id + '/exitTeam/' + team_id, {
      method: 'POST',
      body: JSON.stringify({
        join_state: 0,
        position: 'none-member'
      }),
      headers: headers
    })
      .then(response => {
        this.setState({
          joinState: 0,
          // owner: ''
        })
        firebase
          .firestore()
          .collection("users")
          .where("userId", "==", id)
          .get()
          .then(querySnapShot => {
            // console.log(querySnapShot)
            querySnapShot.forEach(user => {
              console.log("firebase user data.teamId = ", user.data().teamId)
              if (user.data().userId != null && user.data().userId != 0)
                firebase
                  .firestore()
                  .collection("users")
                  .doc(user.data().authId)
                  .update({
                    teamId: 0
                  })
            });
          }
          );
        this.readTeamInfo()
      });
  }

  connectedClick(id) {
    return true
  }

  viewButton(id, join_state) {
    console.log("id = " + id)
    if (join_state == 1) {
      return <Button disabled={false} style={styles.joinBtn} onPress={() => this.acceptClick(id)}>
        <Text style={styles.joinText}>Accept</Text>
      </Button>
    }
    if (join_state == 2) {
      return <Button disabled={false} style={[styles.joinBtn, color = "secondary", { backgroundColor: "#b2bec3" }]} onPress={() => this.connectedClick(id)}>
        <Text style={styles.joinText}>Connected</Text>
      </Button>
    }
  }

  updateDeviceToken(fcmToken) {
    firebase
      .firestore()
      .collection("users")
      .doc(firebase.auth().currentUser.uid)
      .update({
        fcmToken: fcmToken
      });
  }

  /*********** Notification Part **************/

  //1
  async checkPermission() {
    const enabled = await firebase.messaging().hasPermission();
    if (enabled) {
      this.getToken();
    } else {
      this.requestPermission();
    }
  }

  //3
  async getToken() {
    let fcmToken = await AsyncStorage.getItem("fcmToken");
    if (!fcmToken) {
      fcmToken = await firebase.messaging().getToken();
      if (fcmToken) {
        // user has a device token
        await AsyncStorage.setItem("fcmToken", fcmToken);
      }
    }

    if (fcmToken) {
      this.updateDeviceToken(fcmToken);
    }
  }

  //2
  async requestPermission() {
    try {
      await firebase.messaging().requestPermission();
      // User has authorised
      this.getToken();
    } catch (error) {
      // User has rejected permissions
      console.log("permission rejected");
    }
  }

  messagePress() {
    console.log("messagePressed")
    this.setState({ hasPressed: true });
    this.refs.fmLocalInstance.hideMessage();
    // this.props.navigation.navigate("Songs")
  }

  messageShow() {
    this.setState({ hasShown: true });
  }

  messageHide() {
    this.setState({ hasHidden: true });
  }

  showSimpleMessage(type = "default", notification) {
    const message = {
      message: notification.title,
      description: notification.body,
      type: "success",
      hideStatusBar: true,
      onPress: this.messagePress.bind(this),
      onShow: this.messageShow.bind(this),
      onHide: this.messageHide.bind(this),
    };

    console.log(message);
    this.refs.fmLocalInstance.showMessage(message);
  }
  async createNotificationListeners() {

    // this.notificationListener = firebase.notifications().onNotification((notification) => {
    //   const { title, body } = notification;
    //   console.log('onNotification');

    //   const localNotification = new firebase.notifications.Notification({
    //     sound: 'notification',
    //     show_in_foreground: true,
    //   })
    //   .setNotificationId(notification.notificationId)
    //   .setTitle(notification.title)
    //   .setBody(notification.body)
    //   .android.setChannelId('fcm_default_channel')
    //   .android.setSmallIcon('@drawable/ic_launcher')
    //   .android.setColor('#000000')
    //   .android.setPriority(firebase.notifications.Android.Priority.High)

    //   firebase.notifications()
    //     .displayNotification(localNotification)
    //     .catch(err => console.error(err))
    // });

    // const channel = new firebase.notifications.Android.Channel('fcm_default_channel', 'CampusHead', firebase.notifications())
    // .setDescription('Demo app description')
    // .setSound('../../images/notification.mp3');
    // firebase.notifications().android.createChannel(channel);


    this.messageListener = firebase.messaging().onMessage(message => {
      //process data message
      alert("messageListner")
      console.log("messageListener", JSON.stringify(message));
    });

    this.notificationListener = firebase
      .notifications()
      .onNotification(notification => {
        console.log("showalert")
        // this.showAlert(notification);
        var type = "default"
        this.setState({ hasPressed: false, hasShown: false, hasHidden: false });
        this.showSimpleMessage(type, notification)
      });

    /*
     * If your app is in background, you can listen for when a notification is clicked / tapped / opened as follows:
     * */
    this.notificationOpenedListener = firebase
      .notifications()
      .onNotificationOpened(notificationOpen => {
        console.log("opened")
        this.props.navigation.navigate("Songs")
      });

    /*
     * If your app is closed, you can check if it was opened by a notification being clicked / tapped / opened as follows:
     * */
    const notificationOpen = await firebase
      .notifications()
      .getInitialNotification();
    if (notificationOpen) {
      console.log("open ------------ ", notificationOpen)
      const { title, body } = notificationOpen.notification;
      // this.showAlert(notificationOpen.notification);
      // this.props.navigation.navigate("Songs")
    }
    /*
    * Triggered for data only payload in foreground
    * */
  }

  showAlert(notification) {
    Alert.alert(
      notification.title,
      notification.body,
      [{ text: "OK", onPress: () => console.log("OK") }],
      { cancelable: false }
    );
  }

  render() {
    StatusBar.setBarStyle("light-content", true);
    if (Platform.OS === "android") {
      StatusBar.setBackgroundColor(Colors.backgroundcolor, true);
      StatusBar.setTranslucent(true);
    }
    return (
      <View style={styles.mainview}>
        <Header androidStatusBarColor={"transparent"} style={styles.header}>
          <Left style={styles.left}>
            <TouchableOpacity
              onPress={() => this.props.navigation.openDrawer()}
            >
              <Image
                source={Images.MenuIcon}
                style={{
                  height: Metrics.HEIGHT * 0.07,
                  width: Metrics.WIDTH * 0.07,
                  resizeMode: "contain"
                }}
              />
            </TouchableOpacity>
          </Left>
          <Body style={styles.body}>
            <Text style={styles.Dashboardtext}>Notification</Text>
          </Body>

          <Right style={styles.right}>
            {/*  */}
          </Right>
        </Header>
        <View style={{backgroundColor:Colors.backgroundcolor,  height:Metrics.HEIGHT*0.01, width:Metrics.WIDTH}} />
        <View style={{ flex: 1 }}>
          <FlatList
            data={this.state.data}
            renderItem={({ item }) => (
              <View style={styles.rowMain}>
                <View>
                  <TouchableOpacity onPress={() => this.props.navigation.navigate("ViewProfile", { user: item.id })}>
                    {console.log("item.pic = " + item.pic)}
                    <View style={styles.listContent}>
                      {item.pic == null || item.pic == '' ?
                        <Image source={Images.Profile} style={styles.profile} />
                        :
                        <Image source={{ uri: item.pic }} style={styles.profile} />
                      }
                      <View style={styles.subRow}>
                        <View style={styles.headerContent}>
                          <Text style={styles.headerText}>{item.username}</Text>
                        </View>
                        <Text numberOfLines={2} style={styles.recentMsg}>
                          {item.position}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
            )}
            keyExtractor={(item, index) => index.toString()}
            ItemSeparatorComponent={this.renderSeparator}
            ListHeaderComponent={this.renderHeader}
            ListFooterComponent={this.renderFooter}
            refreshing={this.state.refreshing}
            onRefresh={this.handleRefresh}
            // onEndReached={this.handleLoadMore}
            onEndReachedThreshold={0}
          />
        </View>
        <FlashMessage ref="fmLocalInstance" position="top" animated={true} autoHide={true} />
      </View>
    );
  }

}
