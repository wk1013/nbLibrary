/* eslint-disable taro/manipulate-jsx-as-array */
import Taro, { Component } from "@tarojs/taro";
import {View,ScrollView,Icon,RichText,Form,Input} from "@tarojs/components";
import { AtActivityIndicator, AtButton, AtToast, AtFloatLayout } from "taro-ui";
import _ from "lodash";
import RestTools from "../../utils/RestTools";
import Book from "../../components/BookList/book"; //图书类
import Business from "../../components/Business"; //咨询类
import BookSummary from "../../components/BookList/bookSummary"; //图书摘要类
import College from "../../components/College"; //学校类
import Scholar from "../../components/Scholar"; //学者类
import Literature from "../../components/Literature"; //文献类
import BookSame from "../../components/BookList/bookSame";
import SgList from "../../components/SgList"; //句群组件
import NoResult from "../../components/NoResult"; //缺省页
import NavBar from "../../components/NavBar";
import Relativity from "../../components/Relativity";
import Footer from "../../components/Footer";
import NewsBlock from "../../components/NewsBlock";
import voiceRecording from "../../statics/voice-recording.gif";
import ReferenceList from "../../components/Reference/ReferenceList";
import OfficeInfo from "../../components/OfficeInfo/OfficeInfo";
import Weather from "../../components/Weather/Weather";
import LibraryStorage from "../../components/LibraryStorage/LibraryStorage";
import UserFaq from "../../components/UserFaq";
import InputRecord from "../../components/InputRecord";
import InputTips from "../../components/InputTips";
import "./index.scss";

export default class Index extends Component {
  constructor() {
    super();
    this.state = {
      searchValue: "",
      guid: null,
      User: "",
      MobileAye: 0,
      MobileNay: 0,
      Aye: 0,
      Nay: 0,
      data: null,
      sg: false,
      loading: true,
      showVoice: false,
      isOpened: false,
      bookOpen: false,
      libraryStorage: [],
      floatContent: null,
      floatTitle: null,
      showLayout: false,
      tipsData: [],
      showClear: false,
      showRecord: false
    };
  }

  componentWillMount() {
    let that = this;
    const loactionUrl = window.location.href;
    RestTools.getSignatureFromServer(loactionUrl);
    window.wx.ready(function() {
      window.wx.checkJsApi({
        jsApiList: [
          "startRecord",
          "stopRecord",
          "onVoiceRecordEnd",
          "translateVoice"
        ],
        success: function() {
          that.setState({
            showVoice: true
          });
        }
      });
    });
    const question =
      this.state.searchValue ||
      decodeURIComponent(this.$router.params.question); //解码参数，浏览器会编码
    this.setState(
      {
        searchValue: question
      },
      () => {
        this.handleSearch(question);
      }
    );
  }

  getLikeCount = () => {
    const { searchValue, guid } = this.state;
    RestTools.httpRequest_b("/GetLike", "GET", {
      Content: searchValue,
      user: guid
    })
      .then(res => {
        this.setState({
          User: res.User,
          MobileAye: res.MobileAye,
          MobileNay: res.MobileNay,
          Aye: res.Aye,
          Nay: res.Nay
        });
      })
      .catch(err => {
        console.log(err);
      });
  };

  sendLike = like => {
    let { User, guid, Aye, Nay, searchValue } = this.state;
    if (User === "") {
      Taro.request({
        url:
          RestTools.serverUrl +
          `/SendLike?user=${guid}&like=${like}&type=mobile&Content=${searchValue}`,
        method: "POST",
        header: {
          "Access-Control-Allow-Origin": "*"
        }
      })
        .then(res => {
          if (res.data.Success) {
            if (like) {
              Aye += 1;
            } else {
              Nay += 1;
            }
            this.setState({
              Aye: Aye,
              Nay: Nay,
              User: like ? "1" : "0"
            });
          } else {
            Taro.showToast({ title: "出了点小问题~，请稍后再试" });
          }
        })
        .catch(err => {
          console.log(err);
        });
    } else if ((User == "1" && like) || (User == "0" && !like)) {
      this.cancleLike(like);
    } else {
      return;
    }
  };

  cancleLike = like => {
    let { searchValue, guid, Aye, Nay } = this.state;
    Taro.request({
      url:
        RestTools.serverUrl +
        `/CancelLike?user=${guid}&Content=${searchValue}&type=mobile`,
      method: "POST"
    })
      .then(res => {
        if (res.data.Success) {
          like ? (Aye -= 1) : (Nay -= 1);
          this.setState({
            User: "",
            Aye: Aye,
            Nay: Nay
          });
        } else {
          Taro.showToast({ title: "出了点小问题~，请稍后再试" });
        }
      })
      .catch(err => {
        console.log(err);
      });
  };

  componentDidMount() {
    let that = this;
    const loactionUrl = window.location.href.split("#")[0];
    RestTools.getSignatureFromServer(loactionUrl);
    window.wx.ready(function() {
      window.wx.checkJsApi({
        jsApiList: [
          "startRecord",
          "stopRecord",
          "onVoiceRecordEnd",
          "translateVoice"
        ],
        success: function() {
        }
      });
    });
    // window.wx.error(function() {
    //   const url = window.location.href.split("#")[0];
    //   RestTools.getSignatureFromServer(url);
    // });
  }

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
      success: function(response) {
        let localId = response.localId;
        window.wx.translateVoice({
          localId: localId,
          isShowProgressTips: 1, // 默认为1，显示进度提示
          success: function(res) {
            if (!res.translateResult) {
              Taro.showToast({
                title: "哎呀没听清楚呢，请刷新页面再试",
                icon: "none"
              });
            }
            let result = res.translateResult;
            //去掉最后一个句号
            result = result.substring(0, result.length - 1);
            that.setState(
              {
                searchValue: result
              },
              () => {
                that.handleSearch(result);
              }
            );
          }
        });
      },
      fail: function() {
        Taro.showToast({
          title: "哎呀没听清楚呢，请刷新页面再试",
          icon: "none"
        });
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

  //获取馆藏信息
  getLibraryStorage = str => {
    RestTools.httpRequest_b(
      "/GetLocalInfo_NN",
      "GET",
      {
        bookrecnos: str
      },
      false,
      true
    ) //第四个参数是句群APIurl,第五个参数是获取图书馆藏详情的API
      .then(res => {
        let data = this.state.data;
        data.map(item => {
          item.Data.KNode.map(v => {
            v.DATA.map(val => {
              const current = val.FieldValue; //当前书本对象
              const book = _.filter(res.Books, { bookid: current.ID })[0]; // 馆藏数据中对应ID的书的数据
              val.FieldValue = Object.assign(current, book); //合并两个对象
              return val;
            });
            return v;
          });
        });
        this.setState({
          data: data
        });
      });
  };

  getBookId = list => {
    list = list.filter(item => item.Data.domain === "图书馆_图书");
    if (list.length > 0) {
      const bookIdStr = list.map(item =>
        item.Data.KNode.map(val => val.DATA.map(v => v.FieldValue.ID)).join(",")
      );
      this.getLibraryStorage(bookIdStr);
    }
  };

  domainSupported = list => {
    return list.length > 0;
  };

  //获取句群数据
  getSgData = question => {
    RestTools.httpRequest_b(
      "/GetSGData",
      "GET",
      {
        q: question
      },
      true
    )
      .then(res => {
        if (res.result) {
          const MetaList = res.MetaList;
          this.setState({
            loading: false,
            data: MetaList,
            sg: true,
            errMsg: null
          });
        } else {
          this.setState({
            loading: false,
            errMsg: res.msg
          });
        }
      })
      .catch(res => {
        console.log(res);
      });
  };
  goSearch = value => {
    this.setState(
      {
        searchValue: value
      },
      () => {
        this.handleSearch(value);
      }
    );
  };
  //开始搜索
  handleSearch = value => {
    RestTools.setStorageInput(value)
    this.setState(
      {
        searchValue: value,
        loading: true,
        bookOpen: false,
        showVoice: false,
        showLayout: false,
        libraryStorage: []
      },
      () => {
        // this.getLikeCount();
        if (this.libraryStorage != undefined && this.libraryStorage != null) {
          this.libraryStorage.updateState();
        }
      }
    );
    RestTools.httpRequest_b("/GetAnswer", "GET", {
      appid: "lib_neu",
      aid: "ee831eebc9f01c3f18d6c2198ff879b2",
      q: value,
      type: "mobile"
    })
      .then(res => {
        if (res.result) {
          const MetaList = res.MetaList;
          const list = MetaList.filter(
            item => item.Data.domain === "图书馆_图书"
          );

          if (this.domainSupported(MetaList)) {
            this.setState(
              {
                loading: false,
                data: MetaList,
                errMsg: null
              },
              () => {
                if (
                  list.length > 0 &&
                  list[0].Data.KNode[0].DATA[0].FieldValue.hasOwnProperty("ID")
                ) {
                  this.getBookId(MetaList);
                }
              }
            );
          }
        } else {
          this.getSgData(value);
        }
      })
      .catch(err => {
        this.setState({
          loading: false
        });
        console.log(err);
      });
  };

  showLibraryStorage = data => {
    this.setState(
      {
        bookOpen: true,
        libraryStorage: data
      },
      () => {
        this.libraryStorage.updateState();
      }
    );
  };

  //获取分页数据
  getDataByPage = (current, data, target) => {
    const { domain, intent_domain, intent_id, Title } = data;
    RestTools.httpRequest_b("/GetKBDataByPage", "GET", {
      domain: domain,
      intent_domain: intent_domain,
      intent_id: intent_id,
      q: Title,
      pageNum: current
    })
      .then(res => {
        let MetaListData = this.state.data; //之前state的数据
        MetaListData.map(item => {
          if (item.Data.intent_id === res.karea.intent_id) {
            item.Data = res.karea;
          }
          return item;
        }); //遍历处理不同的类型的组件点击分页后的数据
        if (res.result) {
          this.setState(
            {
              bookOpen: false,
              libraryStorage: [],
              data: MetaListData
            },
            () => {
              this.getBookId(MetaListData);
              this.libraryStorage.updateState();
              if (target == "book") {
                this.book.updateState();
              } else if (target == "bookSame") {
                this.bookSame.updateState();
              } else if (target == "bookSummary") {
                this.bookSummary.updateState();
              } else if (target == "news") {
                this.news.updateState();
              } else if (target == "essay") {
                this.essay.updateState();
              }
            }
          );
        } else {
          Taro.showToast({
            title: res.msg,
            icon: "none"
          });
        }
      })
      .catch(res => {
        console.log(res);
      });
  };

  handleInput = e => {
    this.setState(
      {
        showClear: e.target.value,
        searchValue: e.target.value,
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
      searchValue: "",
      showClear: false
    });
  };

  handleFocus = e => {
    e.preventDefault();
    const value = this.state.value;
    this.setState({
      showRecord: !value,
      showClear: false
    });
  };

  handleBlur = e => {
    e.preventDefault();
    this.setState({
      showRecord: false
    });
  };

  handleClickRecord = item => {
    RestTools.setStorageInput(item);
    this.setState(
      {
        searchValue: item,
        showRecord: false,
        tipsData: []
      },
      () => {
        this.handleSearch(item);
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

  //返回事件
  handleGoBack = () => {
    Taro.navigateBack();
  };

  switchMic = () => {
    const showVoice = this.state.showVoice;
    this.setState({
      showVoice: !showVoice
    });
  };

  showLayout = value => {
    this.setState({
      ...value
    });
  };

  render() {
    let {
      searchValue,
      data,
      loading,
      showVoice,
      errMsg = null,
      sg,
      isOpened,
      bookOpen,
      libraryStorage,
      User,
      MobileAye,
      MobileNay,
      Aye,
      Nay,
      floatContent,
      floatTitle,
      showLayout,
      tipsData,
      showClear,
      showRecord
    } = this.state;

    let result = [];
    const recordsData =
      JSON.parse(window.localStorage.getItem("nb_inputRecords")) || [];
    if (data) {
      const noChat = data.filter(
        item =>
          item.Data.Domain != "闲聊_通用" && item.Data.Domain != "闲聊_个性"
      );
      if (noChat.length > 0) {
        data = noChat;
        const officeInfoList = data.filter(
          item => item.Data.domain === "图书馆部门"
        );
        if (officeInfoList.length > 0) {
          officeInfoList.map(item => {
            result.push(<OfficeInfo data={item.Data} />);
          });
        }
        const businessList = data.filter(item => item.DataType === 0);
        if (businessList.length > 0) {
          if (businessList[0].Data.Answer.length == 0) {
            result.push(
              <NoResult search={searchValue} />,
              <Relativity
                keyword={searchValue}
                onSearch={this.goSearch.bind(this)}
                duplicate={businessList[0].Data.Question}
              />
            );
          } else {
            result.push(
              <Business
                data={businessList[0].Data}
                likeData={{ User, MobileAye, MobileNay, Aye, Nay }}
                onClickLike={this.sendLike}
              />,
              <Relativity
                keyword={searchValue}
                onSearch={this.goSearch.bind(this)}
                duplicate={businessList[0].Data.Question}
              />
            );
          }
        }
        const faqnetList = data.filter(item => item.DataType === 1);
        if (faqnetList.length > 0) {
          result.push(<UserFaq data={faqnetList[0].Data} />);
        }
        if (result.length == 0) {
          const referenceList = data.filter(
            item => item.Data.domain === "工具书"
          );
          if (referenceList.length > 0) {
            result.push(<ReferenceList data={referenceList[0].Data.KNode} />);
            data = [];
          }
        }
      } else {
        const individualChatList = data.filter(
          item => item.Data.Domain === "闲聊_个性"
        );
        if (individualChatList.length > 0) {
          result.push(
            <Business
              data={individualChatList[0].Data}
              onClickLike={this.sendLike}
              likeData={{ User, MobileAye, MobileNay, Aye, Nay }}
            />
          );
        } else {
          const commonChatList = data.filter(
            item => item.Data.Domain === "闲聊_通用"
          );
          result.push(
            <Business
              data={commonChatList[0].Data}
              onClickLike={this.sendLike}
              likeData={{ User, MobileAye, MobileNay, Aye, Nay }}
            />
          );
        }
        data = null;
      }
    }

    data &&
      data.map(item => {
        if (item) {
          if (item.DataType === 3) {
            if (item.Data.domain === "图书馆_图书") {
              if (item.Data.intent_id === "8") {
                result.push(
                  <BookSummary
                    data={item.Data}
                    page={item.Data.Page}
                    onGetDataByPage={this.getDataByPage.bind(this)}
                    ref={bookSummary => {
                      this.bookSummary = bookSummary;
                    }}
                  />
                );
              } else if (
                item.Data.intent_id === "7" ||
                item.Data.intent_id === "4" ||
                item.Data.intent_id === "6"
              ) {
                result.push(
                  <BookSame
                    data={item.Data}
                    page={item.Data.Page}
                    onGetDataByPage={this.getDataByPage.bind(this)}
                    onShowLibraryStorage={this.showLibraryStorage.bind(this)}
                    ref={bookSame => {
                      this.bookSame = bookSame;
                    }}
                  />
                );
              } else {
                result.push(
                  <Book
                    data={item.Data}
                    page={item.Data.Page}
                    onGetDataByPage={this.getDataByPage.bind(this)}
                    onShowLibraryStorage={this.showLibraryStorage.bind(this)}
                    ref={book => {
                      this.book = book;
                    }}
                  />
                );
              }
            } else if (item.Data.domain === "学校") {
              result.push(
                <College
                  data={item.Data}
                  page={item.Data.Page}
                  onGetDataByPage={this.getDataByPage.bind(this)}
                />
              );
            } else if (item.Data.domain === "学者") {
              result.push(
                <Scholar
                  data={item.Data}
                  page={item.Data.Page}
                  onGetDataByPage={this.getDataByPage.bind(this)}
                />
              );
            } else if (
              item.Data.domain === "文献" ||
              item.Data.domain === "科研成果"
            ) {
              result.push(
                <Literature
                  data={item.Data}
                  page={item.Data.Page}
                  onGetDataByPage={this.getDataByPage.bind(this)}
                  ref={essay => {
                    this.essay = essay;
                  }}
                />
              );
            } else if (item.Data.domain === "图书馆_动态") {
              result.push(
                <NewsBlock
                  data={item.Data}
                  page={item.Data.Page}
                  onGetDataByPage={this.getDataByPage.bind(this)}
                  ref={news => {
                    this.news = news;
                  }}
                />
              );
            } else if (item.Data.domain === "天气") {
              result.splice(
                0,
                0,
                <Weather
                  data={RestTools.removeRed(
                    item["Data"]["KNode"][0]["DATA"][0]["FieldValue"]["城市"]
                  )}
                />
              );
            }
          }
        }
      });

    return (
      <View className='result'>
        <View className='banner'>
          <NavBar title='结果展示' needBack />
        </View>
        <View className='r_top'>
          <View className='search'>
            <Form onSubmit={this.handleSearch.bind(this, searchValue)}>
              <Icon
                className='iconfont icon-left icon-huatong'
                onClick={this.switchVoice.bind(this)}
              />
              <Input
                className='search_input'
                placeholder='输入问题'
                value={searchValue}
                onChange={this.handleInput.bind(this)}
                onFocus={this.handleFocus.bind(this)}
                onBlur={this.handleBlur.bind(this)}
              />
              <Icon
                className='iconfont icon-right icon-sousuo'
                onClick={this.handleSearch.bind(this, searchValue)}
              />
              {showRecord ? (
                <View className='extra-wrap'>
                  <InputRecord
                    data={recordsData}
                    onClickRecord={this.handleClickRecord}
                  />
                </View>
              ) : null}
              {tipsData.length ? (
                <View className='extra-wrap'>
                  <InputTips
                    data={tipsData}
                    onClickRecord={this.handleClickRecord}
                  />
                </View>
              ) : null}
            </Form>
          </View>
        </View>

        <ScrollView
          className='resultWrap'
          scrollY
          scrollWithAnimation
          scrollTop='0'
        >
          {loading ? (
            <AtActivityIndicator mode='center' size={64} />
          ) : errMsg ? (
            <NoResult search={this.state.searchValue} />
          ) : result.length ? (
            <View>
              <View
                style={{
                  color: "#028fd4",
                  fontSize: "18px",
                  padding: "10px 0 0 20px",
                  fontWeight: "bold"
                }}
              >
                答：
              </View>
              {result}
            </View>
          ) : (
            sg && (
              <SgList data={data} onShowLayout={this.showLayout.bind(this)} />
            )
          )}
        </ScrollView>

        {showVoice && (
          <View
            className='voice'
            onTouchStart={this.handleTouchStart.bind(this)}
            onTouchCancel={this.handleTouchCancel.bind(this)}
            onTouchEnd={this.handleTouchEnd.bind(this)}
          >
            <AtButton type='primary'>
              <Icon className='iconfont icon-huatong huatong' /> 按住说话
            </AtButton>
          </View>
        )}
        <Footer />
        <AtToast
          isOpened={isOpened}
          duration={0}
          text='正在聆听...'
          image={voiceRecording}
        />

        {floatContent && (
          <AtFloatLayout
            isOpened={showLayout}
            scrollY
            title={floatTitle}
            scrollWithAnimation
          >
            <RichText
              className='float-content'
              nodes={RestTools.lineFeed(RestTools.translteToRed(floatContent))}
            />
          </AtFloatLayout>
        )}

        <LibraryStorage
          bookOpen={bookOpen}
          libraryStorage={libraryStorage}
          ref={libraryStorage => {
            this.libraryStorage = libraryStorage;
          }}
        />
      </View>
    );
  }
}
