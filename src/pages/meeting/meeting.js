import Taro, { Component } from "@tarojs/taro";
import {View,} from "@tarojs/components";
import _ from "lodash";
import NavBar from "../../components/NavBar";
import "./meeting.scss";
import RestTools from "../../utils/RestTools";
import QuestionCard from "../../components/MeetingCard";
import MockData from "../../mock/mockData.json";

export default class Index extends Component {
  constructor() {
    super(...arguments);
    this.state = {
      value: "",
      tipsData: [],
      showClear: false,
      showVoice: false,
      showRecord: false,
      isOpened: false
    };
  }
  config = {
    navigationBarTitleText: "第二届创新创意推广活动现场研议会议"
  };

  componentWillMount() { }

  componentDidMount() {
    let that = this;
    const loactionUrl = window.location.href;
    RestTools.getSignatureFromServer(loactionUrl);
    window.wx.ready(function () {
      window.wx.checkJsApi({
        jsApiList: [
          "startRecord",
          "stopRecord",
          "onVoiceRecordEnd",
          "translateVoice"
        ],
        success: function () {
          that.setState({
            showVoice: true
          });
        }
      });
    });
    // window.wx.error(function () {
    //   const url = window.location.href.split("#")[0];
    //   RestTools.getSignatureFromServer(url);
    // });
  }

  componentWillUnmount() { }

  componentDidShow() { }

  componentDidHide() { }

  handleTouchStart = e => {
    e.preventDefault();
    this.setState({
      isOpened: true
    });
    window.wx.startRecord();
  };

  handleRecord = () => {
    let that = this;
    window.wx.stopRecord({
      success: function (response) {
        let localId = response.localId;
        window.wx.translateVoice({
          localId: localId,
          // isShowProgressTips: 1, // 默认为1，显示进度提示
          success: function (res) {
            if (!res.translateResult) {
              // window.wx.stopRecord()
              Taro.showToast({ title: "说话声音太短", icon: "none" });
            }
            let result = res.translateResult;
            //去掉最后一个句号
            result = result.substring(0, result.length - 1);
            that.setState(
              {
                question: result
              },
              () => {
                that.goSearch();
                Taro.navigateTo({
                  url: `../result/index?question=${result}`
                });
              }
            );
          },
          fail: function () {
            window.wx.stopRecord();
            Taro.showToast({ title: "哎呀没听清楚~,请再说一次", icon: "none" });
          }
        });
      },
      fail: function () {
        window.wx.stopRecord();
        Taro.showToast({ title: "哎呀没听清楚~,请刷新页面再试", icon: "none" });
      }
    });
  };

  handleTouchCancel = e => {
    e.preventDefault();
    this.setState({
      isOpened: false
    });
    this.handleRecord();
  };

  handleTouchEnd = e => {
    e.preventDefault();
    this.setState({
      isOpened: false
    });
    this.handleRecord();
  };
  handleGridClick = item => {
    Taro.navigateTo({
      url: item.url
    });
  };

  handleInput = e => {
    this.setState(
      {
        showClear: e.target.value,
        value: e.target.value,
        showRecord: !e.target.value
      },
      () => {
        RestTools.getInputTips(e.target.value).then(res => {
          this.setState({
            tipsData: res.map(item => item.value)
          });
        });
      }
    );
  };

  handleSwiperClick = item => {
    if (item.source === "博悦") {
      Taro.navigateTo({
        url: "../exhibition/exDetail.js?id=" + item.source_ID
      });
    } else {
      Taro.navigateTo({
        url: "../exhibition/detail.js?id=" + item.编号
      });
    }
  };

  handleClear = () => {
    this.setState({
      value: "",
      showClear: false
    });
  };

  handleFocus = e => {
    e.preventDefault();
    const value = this.state.value;
    const show = !value ? false : true;
    this.setState({
      showRecord: !value,
      showClear: show
    });
  };

  handleBlur = e => {
    e.preventDefault();
    this.setState({
      showRecord: false
    });
  };

  handleClickRecord = item => {
    RestTools.setStorageInput(item)
    this.setState(
      {
        value: item,
        showRecord: false,
        tipsData: []
      },
      () => {
        this.goSearch();
      }
    );
  };

  switchVoice = e => {
    e.stopPropagation();
    const showVoice = this.state.showVoice;
    this.setState({
      showVoice: !showVoice
    });
  };

  goSearch = e => {
    if (e) e.preventDefault();
    const { value } = this.state;
    this.setState(
      {
        showRecord: false
      },
      () => {
        if (value.trim()) {
          alert("跳转到下一级页面");
        } else {
          Taro.showToast({
            title: "请先输入问题哟~",
            icon: "none"
          });
        }
      }
    );
  };

  render() {
    return (
      <View className='meetings'>
        <View className='banner'>
          <NavBar title="第二届创新创意推广活动现场研议会议" needBack />
        </View>
        <View className='logo_wrap'>
        </View>


        {/* 会议通知 */}
        <QuestionCard 
          title='会议通知'
          data={MockData.meetingInvite}
          name="meetingInvite"
        />

        {/* 会议议程 */}
        <QuestionCard 
          title='会议议程'
          data={MockData.meetingAgenda}
          index="1"
        />

        {/* 入围案例 */}
        <QuestionCard
          title='入围案例'
          data={MockData.ideaMeeting}
          name="ideaMeeting"
        />
      </View>
    );
  }
}
