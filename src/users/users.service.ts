import { ConflictException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './User';
import { CreateUserDto } from './CreateUserDto';

import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(@InjectModel('User') private readonly userModel: Model<User>) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    createUserDto = { ...createUserDto, password: await bcrypt.hash(createUserDto.password, 10) };
    const createUser = new this.userModel(createUserDto);
    return createUser.save().catch(err => {
      if (!!err && err.name === 'MongoError' && err.code === 11000) {
        throw new ConflictException('User already exists');
      } else {
        throw err;
      }
    });
  }

  async findOne(username: string) {
    return this.userModel.findOne({ username });
  }

  async findOneAllowPassword(username: string) {
    return this.userModel
      .findOne({ username })
      .select('+password')
      .exec();
  }

  async find(): Promise<User[]> {
    return this.userModel.find();
  }

  async count(): Promise<User[]> {
    return this.userModel.countDocuments();
  }

  async update(username: string, updateUserDto: any): Promise<User> {
    return this.userModel.findOneAndUpdate({ username }, updateUserDto, { new: true });
  }

  async updateMany(usernames: string[], updateUserDto: any): Promise<User> {
    return this.userModel.updateMany({ username: usernames}, updateUserDto, { new: true });
  }

  async deleteOne(username): Promise<any> {
    return this.userModel.deleteOne({ username }).then(res => {
      if (res.ok !== 1 || res.deletedCount === 0) {
        throw new InternalServerErrorException('Deletion failed');
      }
      return res;
    });
  }

  async delete(userNames: string[]): Promise<any> {
    return this.userModel.remove({ username: userNames });
  }
}
