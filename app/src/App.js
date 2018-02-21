import React, { Component } from 'react';
import logo from './logo.svg';
import {Page, Card,Banner,Button,Badge,AccountConnection,Link,Select,SkeletonBodyText,Layout,FormLayout,TextField, SettingToggle, TextStyle} from '@shopify/polaris';

import {EmbeddedApp} from '@shopify/polaris/embedded';
import './App.css';
import '@shopify/polaris/styles.css';

import axios from 'axios';
const apiKey= '53e471bfc5b2056f065ab25d13628864';
const shopOrigin='https://true-north-arms-corp.myshopify.com';
//const apiUrl='https://labelify.herokuapp.com';
const apiUrl= "http://localhost:3000";


class App extends Component {
    constructor(props) {
        super(props);
        this.state = {
            pagesize:50,
            currentpage:1,
            count:0,
            options:[],
            typeoptions      : [
                {
                    label    : "Vertical for 2\" kraft bins",
                    value    : "vertical"
                } ,  {
                    label    : "Horizontal for poly bins",
                    value    : "horizon"
                }
            ],
	        currenttype:'horizon',
            loading: true,
            saveText: 'Save',
            savingNotification: false
        } ;
    }
    componentWillMount(){
        this.getSettings();
    }
    componentDidMount() {

    }


    enableSync(){
      let t=false;  if(this.state.settings.enabled) {
            t=false;
        }else{
            t=true;
        }


        let settings = Object.assign({}, this.state.settings);    //creating copy of object
            settings.enabled = t;

            //updating value
            this.setState({settings});

    }


    getSettings=()=>{

        axios.get(apiUrl+'/api/getProductsCount?shop=true-north-arms-corp.myshopify.com').then(({data})=>{
            console.log();

            this.setState({count:data.count,loading:false});

            let pSize = this.state.pagesize;
            let totalpages= Math.ceil(this.state.count/this.state.pagesize);
            let options=[];
            for (var i=1;i<=totalpages;i++)
            {
                options.push(
                    {
                        label:'Products ('+((i-1)*pSize+1)+"-"+i*pSize+")",

                         value:i
                    });
            }


           this.setState({options});
    });

    }

    downloadProducts(){
    //    localhost:3000
        window.open(apiUrl+`/api/downloadlabels.pdf?shop=true-north-arms-corp.myshopify.com&type=${this.state.currenttype}&page=${this.state.currentpage}`);
        this.setState({savingNotification:true});
        setTimeout(()=>{
            this.setState({savingNotification:false});


        },5000);



        }
  render() {
    return (
        <EmbeddedApp
            shopOrigin={shopOrigin}
            apiKey={apiKey}
            forceRedirect={false}

        >
        <Page
            title="Labels"


        >

            <Layout>
                <Layout.AnnotatedSection title="Generate Labels"  description="Here you can download labels of the products." >

                    {(!this.state.loading) ? (<Card sectioned>
                            <FormLayout>
                                <p>Total Products : <b>{this.state.count}</b></p>
                                <Select
                                    label="Select Products Label list to download "
                                    options={this.state.options}
                                    placeholder="Select a value"
                                    onChange={(v)=>{
                                        console.log(v);
                                        this.setState({currentpage:v})
                                    }}
                                     value={this.state.currentpage}
                                />
	                            <Select
		                            label="Type "
		                            options={this.state.typeoptions}
		                            placeholder="Select Type"
		                            onChange={(v)=>{
			                            console.log(v);
			                            this.setState({currenttype:v})
		                            }}
		                            value={this.state.currenttype}
	                            />
                                <Button primary onClick={this.downloadProducts.bind(this)}
                                    loading={this.state.savingNotification}>Download</Button>




                            </FormLayout>
                        </Card>) :
                        ( <Card >
                            <Card.Section>
                                <SkeletonBodyText lines={2} />
                            </Card.Section>
                            <br/>
                            <Card.Section>
                                <SkeletonBodyText lines={1} />
                            </Card.Section>
                            <br/>
                            <Card.Section>
                                <SkeletonBodyText lines={1} />
                            </Card.Section>
                            <br/>
                            <Card.Section>
                                <SkeletonBodyText lines={1} />
                            </Card.Section>
                            <br/>
                            <Card.Section>
                                <SkeletonBodyText lines={1} />
                            </Card.Section>

                        </Card>)
                    }

                </Layout.AnnotatedSection>
            </Layout>

        </Page>
        </EmbeddedApp>
    );
  }
}

export default App;
