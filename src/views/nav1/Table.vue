<template>
  <section>
    <!--工具条-->
    <el-col :span="24" class="toolbar" style="padding-bottom: 0px;">
      <el-form :inline="true" :model="filters">
        <el-form-item>
          <el-input v-model="filters.name" placeholder="商品名称"></el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" v-on:click="getUsers">查询</el-button>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleAdd">新增</el-button>
        </el-form-item>
      </el-form>
    </el-col>

    <!--商品列表-->
    <el-table
      :data="users"
      highlight-current-row
      v-loading="listLoading"
      @selection-change="selsChange"
      style="width: 100%;"
    >
      <el-table-column type="selection" width="55"></el-table-column>
      <el-table-column type="index" width="60"></el-table-column>
      <el-table-column prop="goodsname" label="商品名称" width="120" sortable></el-table-column>
      <el-table-column prop="goodscount" label="库存" width="100" sortable></el-table-column>
      <el-table-column prop="goodsprice" label="价格" width="100" sortable></el-table-column>
      <el-table-column prop="memo" label="备注"></el-table-column>
      <el-table-column label="操作" width="280">
        <template scope="scope">
          <el-button size="small" @click="handleEdit(scope.$index, scope.row)">编辑</el-button>
          <el-button type="primary" size="small" @click="handleout(scope.$index, scope.row,'入库')">入库</el-button>
          <el-button type="success" size="small" @click="handleout(scope.$index, scope.row,'出库')">出库</el-button>
          <el-button type="danger" size="small" @click="handleDel(scope.$index, scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!--工具条-->
    <el-col :span="24" class="toolbar">
      <el-button type="danger" @click="batchRemove" :disabled="this.sels.length===0">批量删除</el-button>
      <el-pagination
        layout="prev, pager, next"
        @current-change="handleCurrentChange"
        :page-size="10"
        :total="total"
        style="float:right;"
      ></el-pagination>
    </el-col>

    <!--出入库界面-->
    <el-dialog :title="inorout" width="10%" v-model="inOrOutFormVisible">
      <el-form :model="editForm" label-width="80px" :rules="editFormRules" ref="inoroutForm">
        <el-form-item label="商品名称" prop="goodsname">
          <el-input v-model="editForm.goodsname" auto-complete="off"></el-input>
        </el-form-item>
        <el-form-item :label="inorout=='入库'?'入库数量':'出库数量'">
          <el-input v-model="inoroutCount" auto-complete="off"></el-input>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click.native="inOrOutFormVisible = false">取消</el-button>
        <el-button type="primary" @click.native="inOrOutSubmit" :loading="editLoading">确认</el-button>
      </div>
    </el-dialog>

    <!--编辑界面-->
    <el-dialog title="编辑" v-model="editFormVisible" :close-on-click-modal="false">
      <el-form :model="editForm" label-width="80px" :rules="editFormRules" ref="editForm">
        <el-form-item label="商品名称" prop="goodsname">
          <el-input v-model="editForm.goodsname" auto-complete="off"></el-input>
        </el-form-item>
        <el-form-item label="价格">
          <el-input v-model="editForm.goodsprice" auto-complete="off"></el-input>
        </el-form-item>
        <el-form-item label="库存">
          <el-input-number v-model="editForm.goodscount" :min="0" :max="200" :disabled="true"></el-input-number>
        </el-form-item>
        <!-- <el-form-item label="生日">
					<el-date-picker type="date" placeholder="选择日期" v-model="editForm.birth"></el-date-picker>
        </el-form-item>-->
        <el-form-item label="备注">
          <el-input type="textarea" v-model="editForm.memo"></el-input>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click.native="editFormVisible = false">取消</el-button>
        <el-button type="primary" @click.native="editSubmit" :loading="editLoading">提交</el-button>
      </div>
    </el-dialog>

    <!--新增界面-->
    <el-dialog title="新增" v-model="addFormVisible" :close-on-click-modal="false">
      <el-form :model="addForm" label-width="80px" :rules="addFormRules" ref="addForm">
        <el-form-item label="商品名称" prop="goodsname">
          <el-input v-model="addForm.goodsname" auto-complete="off"></el-input>
        </el-form-item>
        <el-form-item label="价格">
          <el-input v-model="addForm.goodsprice" auto-complete="off"></el-input>
        </el-form-item>
        <el-form-item label="库存">
          <el-input-number v-model="addForm.goodscount" :min="0" :max="200"></el-input-number>
        </el-form-item>
        <!-- <el-form-item label="生日">
					<el-date-picker type="date" placeholder="选择日期" v-model="addForm.birth"></el-date-picker>
        </el-form-item>-->
        <el-form-item label="备注">
          <el-input type="textarea" v-model="addForm.memo"></el-input>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click.native="addFormVisible = false">取消</el-button>
        <el-button type="primary" @click.native="addSubmit" :loading="addLoading">提交</el-button>
      </div>
    </el-dialog>
  </section>
</template>

<script>
import util from "../../common/js/util";
//import NProgress from 'nprogress'
import {
  getUserListPage,
  removeUser,
  batchRemoveUser,
  editUser,
  addUser,
  genUuid
} from "../../api/api";

export default {
  data() {
    return {
      filters: {
        name: ""
      },
      users: [],
      total: 0,
      page: 1,
      size: 10,
      listLoading: false,
      sels: [], //列表选中列
      inorout: "", //出库或入库
      inoroutCount: 0, //出库或入库数量
      editFormVisible: false, //编辑界面是否显示
      editLoading: false,
      inOrOutFormVisible: false,
      editFormRules: {
        name: [{ required: true, message: "请输入姓名", trigger: "blur" }]
      },
      //编辑界面数据
      editForm: {
        uuid: "",
        goodsname: "",
        goodscount: 0,
        goodsprice: 0,
        memo: ""
      },

      addFormVisible: false, //新增界面是否显示
      addLoading: false,
      addFormRules: {
        name: [{ required: true, message: "请输入姓名", trigger: "blur" }]
      },
      //新增界面数据
      addForm: {
        uuid: "",
        goodsname: "",
        goodscount: -1,
        goodsprice: 0,
        memo: ""
      }
    };
  },
  methods: {
    //性别显示转换
    formatSex: function(row, column) {
      return row.sex == 1 ? "男" : row.sex == 0 ? "女" : "未知";
    },
    handleCurrentChange(val) {
      this.page = val;
      this.getUsers();
    },
    //获取用户列表
    getUsers() {
      var _this = this;
      let para = {
        page: this.page,
		size: this.size,
		filter:this.filters.name,
        userid: JSON.parse(sessionStorage.getItem("user"))[0].uuid
      };
      debugger;
      this.listLoading = true;
      //NProgress.start();
      this.$fetch("/getGoodsList", para).then(res => {
		debugger;
        _this.total = res.data.total;
        _this.users = res.data.data;
        _this.listLoading = false;
        //NProgress.done();
      });
    },
    handleout: function(index, row, inorout) {
      this.inorout = inorout;
      this.inOrOutFormVisible = true;
      this.editForm = Object.assign({}, row);
    },
    //删除
    handleDel: function(index, row) {
      this.$confirm("确认删除该记录吗?", "提示", {
        type: "warning"
      })
        .then(() => {
          this.listLoading = true;
          //NProgress.start();
          let para = { id: row.id };
          removeUser(para).then(res => {
            this.listLoading = false;
            //NProgress.done();
            this.$message({
              message: "删除成功",
              type: "success"
            });
            this.getUsers();
          });
        })
        .catch(() => {});
    },
    //显示编辑界面
    handleEdit: function(index, row) {
      this.editFormVisible = true;
      this.editForm = Object.assign({}, row);
    },
    //显示新增界面
    handleAdd: function() {
      this.addFormVisible = true;
      this.addForm = {
        uuid: "",
        goodsname: "",
        goodscount: 0,
        goodsprice: 0,
        memo: ""
      };
    },
    inOrOutSubmit: function() {
      var _this = this;
      this.$refs.inoroutForm.validate(valid => {
        if (valid) {
          this.$confirm(
            "确认" +
              _this.editForm.goodsname +
              _this.inorout +
              _this.inoroutCount +
              "个吗？",
            "提示",
            {}
          ).then(() => {
            this.editLoading = true;
            //NProgress.start();
            let para = {};
            para.inoroutCount = _this.inoroutCount;
            para.inorout = _this.inorout;
            para.uuid = _this.editForm.uuid;
            debugger;
            _this.$fetch("/inorout", para).then(res => {
              this.editLoading = false;
              //NProgress.done();
              if (res.code == 200) {
                _this.$message({
                  message: res.msg,
                  type: "success"
                });
              } else {
                _this.$message({
                  message: res.msg,
                  type: "fail"
                });
              }
              this.inOrOutFormVisible = false;

              this.getUsers();
            });
          });
        }
      });
    },
    //编辑
    editSubmit: function() {
      this.$refs.editForm.validate(valid => {
        if (valid) {
          this.$confirm("确认提交吗？", "提示", {}).then(() => {
            this.editLoading = true;
            //NProgress.start();
            let para = Object.assign({}, this.editForm);
            debugger;
            this.$fetch("/editGoodsList", para).then(res => {
              this.editLoading = false;
            if ((res.code = 200)) {
                this.$message({
                  message: "修改成功！",
                  type: "success"
                });
              } else {
                this.$message({
                  message: "修改失败！",
                  type: "fail"
                });
              }
              this.$refs["editForm"].resetFields();
              this.editFormVisible = false;
              this.getUsers();
            });
          });
        }
      });
    },
    //新增
    addSubmit: function() {
      this.$refs.addForm.validate(valid => {
        if (valid) {
          this.$confirm("确认提交吗？", "提示", {}).then(() => {
            this.addLoading = true;
            //NProgress.start();
            let para = Object.assign({}, this.addForm);
            para.uuid = genUuid();
            debugger;
            this.$fetch("/addGoodsList", para).then(res => {
              this.addLoading = false;
              //NProgress.done();
              if ((res.code = 200)) {
                this.$message({
                  message: "提交成功！",
                  type: "success"
                });
              } else {
                this.$message({
                  message: "提交失敗！",
                  type: "fail"
                });
              }

              this.$refs["addForm"].resetFields();
              this.addFormVisible = false;
              this.getUsers();
            });
          });
        }
      });
    },
    selsChange: function(sels) {
      this.sels = sels;
    },
    //批量删除
    batchRemove: function() {
      var ids = this.sels.map(item => item.id).toString();
      this.$confirm("确认删除选中记录吗？", "提示", {
        type: "warning"
      })
        .then(() => {
          this.listLoading = true;
          //NProgress.start();
          let para = { ids: ids };
          batchRemoveUser(para).then(res => {
            this.listLoading = false;
            //NProgress.done();
            this.$message({
              message: "删除成功",
              type: "success"
            });

            this.getUsers();
          });
        })
        .catch(() => {});
    }
  },
  mounted() {
    this.getUsers();
  }
};
</script>

<style scoped>
</style>